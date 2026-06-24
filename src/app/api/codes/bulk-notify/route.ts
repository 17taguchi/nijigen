import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAuthClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase_auth = await createAuthClient()
  const { data: { user } } = await supabase_auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { enabled } = await req.json()
  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled は必須です' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('codes')
    .update({ notification_enabled: enabled })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
