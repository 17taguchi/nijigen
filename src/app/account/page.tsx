'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/browser'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
  }, [])

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail) return
    setLoading('email')
    const { error } = await createClient().auth.updateUser({ email: newEmail })
    if (error) {
      showMessage('error', error.message)
    } else {
      showMessage('success', 'メールアドレスを変更しました')
      setEmail(newEmail)
      setNewEmail('')
    }
    setLoading(null)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      showMessage('error', 'パスワードは8文字以上で入力してください')
      return
    }
    setLoading('password')
    const { error } = await createClient().auth.updateUser({ password: newPassword })
    if (error) {
      showMessage('error', error.message)
    } else {
      showMessage('success', 'パスワードを変更しました')
      setNewPassword('')
    }
    setLoading(null)
  }

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleDelete() {
    if (deleteConfirm !== email) {
      showMessage('error', 'メールアドレスが一致しません')
      return
    }
    setLoading('delete')
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) {
      await createClient().auth.signOut()
      router.push('/login')
    } else {
      showMessage('error', 'アカウントの削除に失敗しました')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">アカウント設定</h1>
          <p className="text-sm text-gray-500 mt-1">{email}</p>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {/* メールアドレス変更 */}
          <form onSubmit={handleEmailChange} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">メールアドレス変更</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新しいメールアドレス</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="new@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading === 'email'}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {loading === 'email' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              変更する
            </button>
          </form>

          {/* パスワード変更 */}
          <form onSubmit={handlePasswordChange} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">パスワード変更</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード <span className="text-gray-400 font-normal">（8文字以上）</span></label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading === 'password'}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {loading === 'password' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              変更する
            </button>
          </form>

          {/* ログアウト */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-3">ログアウト</h2>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ログアウトする
            </button>
          </div>

          {/* アカウント削除 */}
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-red-600">アカウント削除</h2>
              <p className="text-sm text-gray-500 mt-1">削除するとすべてのコードとスキャン履歴が失われます。この操作は取り消せません。</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                確認のため <span className="font-mono text-gray-900">{email}</span> を入力してください
              </label>
              <input
                type="email"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400"
                placeholder={email}
              />
            </div>
            <button
              onClick={handleDelete}
              disabled={loading === 'delete' || deleteConfirm !== email}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {loading === 'delete' && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              アカウントを削除する
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
