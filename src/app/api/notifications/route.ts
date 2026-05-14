import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAuthClient } from '@/lib/supabase/server'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const supabase_auth = await createAuthClient()
  const { data: { user } } = await supabase_auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const offset = Number(req.nextUrl.searchParams.get('offset') ?? 0)

  const supabase = createServerClient()

  const { data: codes } = await supabase
    .from('codes')
    .select('id, name')
    .eq('user_id', user.id)

  if (!codes || codes.length === 0) return NextResponse.json({ items: [], hasMore: false })

  const codeIds = codes.map((c) => c.id)
  const codeMap = Object.fromEntries(codes.map((c) => [c.id, c.name]))

  const { data: scans, error } = await supabase
    .from('scans')
    .select('id, code_id, scanned_at, city, region, country')
    .in('code_id', codeIds)
    .order('scanned_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = (scans ?? []).slice(0, PAGE_SIZE).map((s) => ({
    id: s.id,
    code_name: codeMap[s.code_id] ?? '不明',
    code_id: s.code_id,
    scanned_at: s.scanned_at,
    area: [s.city, s.region, s.country].filter(Boolean).join(' / ') || 'エリア不明',
  }))

  return NextResponse.json({ items, hasMore: (scans ?? []).length > PAGE_SIZE })
}
