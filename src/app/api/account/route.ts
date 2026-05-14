import { NextResponse } from 'next/server'
import { createServerClient, createAuthClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase_auth = await createAuthClient()
  const { data: { user } } = await supabase_auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // ユーザーのコードとスキャンをすべて削除（cascade で自動削除されるが明示的に）
  await supabase.from('codes').delete().eq('user_id', user.id)

  // Supabase Auth からユーザーを削除
  const { error } = await supabase.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
