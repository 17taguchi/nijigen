import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateShortCode } from '@/lib/utils'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, memo, original_url, notification_enabled, notification_email } = body

  if (!name || !original_url) {
    return NextResponse.json({ error: 'name と original_url は必須です' }, { status: 400 })
  }

  const supabase = createServerClient()
  const short_code = generateShortCode()

  const { data, error } = await supabase
    .from('codes')
    .insert({ name, memo, original_url, short_code, notification_enabled, notification_email })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
