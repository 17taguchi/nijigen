'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function NewCodePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    memo: '',
    original_url: '',
    notification_enabled: false,
    notification_email: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'コード名を入力してください'
    if (!form.original_url.trim()) {
      errs.original_url = 'URLを入力してください'
    } else {
      try {
        new URL(form.original_url)
      } catch {
        errs.original_url = '有効なURLを入力してください（例：https://example.com）'
      }
    }
    if (form.notification_enabled && !form.notification_email.trim()) {
      errs.notification_email = '通知先メールアドレスを入力してください'
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/codes/${data.id}`)
    } else {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">新規二次元コード作成</h1>
          <p className="text-gray-500 mt-1">URLを入力して二次元コードを生成します</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {/* 基本情報 */}
          <div className="p-6 space-y-5">
            <h2 className="font-medium text-gray-900">基本情報</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                コード名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：春チラシ、駅前配布用"
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                  errors.name ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
              <textarea
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="配布場所や用途など（任意）"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                遷移先URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={form.original_url}
                onChange={(e) => setForm({ ...form, original_url: e.target.value })}
                placeholder="https://example.com"
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                  errors.original_url ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.original_url && <p className="text-xs text-red-500 mt-1">{errors.original_url}</p>}
              <p className="text-xs text-gray-400 mt-1">二次元コードを読み込んだ際に遷移するURLです</p>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="p-6 space-y-4">
            <h2 className="font-medium text-gray-900">通知設定</h2>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.notification_enabled}
                  onChange={(e) => setForm({ ...form, notification_enabled: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${form.notification_enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform ${form.notification_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">読み込み時にメール通知を受け取る</p>
                <p className="text-xs text-gray-400">二次元コードが読み込まれるたびにメールが届きます</p>
              </div>
            </label>

            {form.notification_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  通知先メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.notification_email}
                  onChange={(e) => setForm({ ...form, notification_email: e.target.value })}
                  placeholder="example@email.com"
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                    errors.notification_email ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors.notification_email && (
                  <p className="text-xs text-red-500 mt-1">{errors.notification_email}</p>
                )}
              </div>
            )}
          </div>

          {/* アクション */}
          <div className="px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              二次元コードを生成
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
