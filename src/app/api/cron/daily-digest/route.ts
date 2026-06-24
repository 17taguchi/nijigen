import { NextRequest, NextResponse } from 'next/server'
import { subDays } from 'date-fns'
import { createServerClient } from '@/lib/supabase/server'
import { sendDailyDigest } from '@/lib/email'
import { Code } from '@/lib/supabase/types'

export const maxDuration = 60

function recipientsFor(code: Code, accountEmail: string): string[] {
  if (!code.notification_email) return [accountEmail]
  return code.notification_email
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const now = new Date()

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })

  let sentCount = 0

  for (const user of usersData.users) {
    if (!user.email) continue

    const { data: codes } = await supabase
      .from('codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('notification_enabled', true)
    if (!codes || codes.length === 0) continue

    const codeIds = codes.map((c) => c.id)
    const codeMap = Object.fromEntries(codes.map((c) => [c.id, c.name]))

    const { data: scans } = await supabase
      .from('scans')
      .select('id, code_id, scanned_at, city, region, country')
      .in('code_id', codeIds)
      .gte('scanned_at', subDays(now, 60).toISOString())
      .order('scanned_at', { ascending: false })

    if (!scans || scans.length === 0) continue

    // 宛先ごとに対象コードをグループ化
    const recipientCodes = new Map<string, Code[]>()
    for (const code of codes) {
      for (const recipient of recipientsFor(code, user.email)) {
        recipientCodes.set(recipient, [...(recipientCodes.get(recipient) ?? []), code])
      }
    }

    for (const [recipient, recipientCodeList] of recipientCodes) {
      const recipientCodeIds = new Set(recipientCodeList.map((c) => c.id))
      const recipientScans = scans.filter((s) => recipientCodeIds.has(s.code_id))

      const todayScans = recipientScans.filter((s) => new Date(s.scanned_at) >= subDays(now, 1))
      if (todayScans.length === 0) continue

      const codeStats = recipientCodeList.map((c) => {
        const codeScans = recipientScans.filter((s) => s.code_id === c.id)
        const countSince = (days: number) =>
          codeScans.filter((s) => new Date(s.scanned_at) >= subDays(now, days)).length
        return {
          name: c.name,
          d3: countSince(3),
          d7: countSince(7),
          d28: countSince(28),
          d60: countSince(60),
        }
      })

      await sendDailyDigest({
        to: recipient,
        scans: todayScans.map((s) => ({
          codeName: codeMap[s.code_id] ?? '不明',
          area: [s.city, s.region, s.country].filter(Boolean).join(' / ') || 'エリア不明',
          scannedAt: s.scanned_at,
        })),
        codeStats,
      })
      sentCount++
    }
  }

  return NextResponse.json({ success: true, sentCount })
}
