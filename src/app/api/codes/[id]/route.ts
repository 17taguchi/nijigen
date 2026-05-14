import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAuthClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

type CodeUpdate = Database['public']['Tables']['codes']['Update']

async function getUser() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function verifyOwnership(id: string, userId: string) {
  const supabase = createServerClient()
  const { data } = await supabase.from('codes').select('id').eq('id', id).eq('user_id', userId).single()
  return !!data
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!await verifyOwnership(id, user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = createServerClient()
  const { data, error } = await supabase.from('codes').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!await verifyOwnership(id, user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body: CodeUpdate = await req.json()
  const supabase = createServerClient()

  const { data, error } = await supabase.from('codes').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!await verifyOwnership(id, user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = createServerClient()
  const { error } = await supabase.from('codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
