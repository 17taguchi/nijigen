import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ shortCode: string }> }) {
  const { shortCode } = await params
  const supabase = createServerClient()

  const { data: code, error } = await supabase
    .from('codes')
    .select('id, original_url')
    .eq('short_code', shortCode)
    .single()

  if (error || !code) {
    return NextResponse.json({ error: 'コードが見つかりません' }, { status: 404 })
  }

  // IPアドレス取得
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null

  // IP位置情報を取得
  let country: string | null = null
  let region: string | null = null
  let city: string | null = null

  if (ip && ip !== '::1' && ip !== '127.0.0.1') {
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city&lang=ja`, {
        signal: AbortSignal.timeout(2000),
      })
      if (geoRes.ok) {
        const geo = await geoRes.json()
        country = geo.country || null
        region = geo.regionName || null
        city = geo.city || null
      }
    } catch {
      // 位置情報取得失敗は無視
    }
  }

  // スキャン記録
  await supabase.from('scans').insert({
    code_id: code.id,
    ip_address: ip,
    user_agent: req.headers.get('user-agent'),
    country,
    region,
    city,
  })

  return NextResponse.redirect(code.original_url, 302)
}
