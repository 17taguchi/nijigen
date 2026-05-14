import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAuthClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase_auth = await createAuthClient()
  const { data: { user } } = await supabase_auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServerClient()

  // 所有権確認
  const { data: code } = await supabase.from('codes').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!code) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('code_id', id)
    .order('scanned_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
