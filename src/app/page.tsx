'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Code } from '@/lib/supabase/types'
import { formatDate, getShortUrl } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'

export default function DashboardPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [scanCounts, setScanCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [bulkToggling, setBulkToggling] = useState(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [rowForm, setRowForm] = useState({ category: '', cost: '', notification_email: '' })
  const [rowSaving, setRowSaving] = useState(false)
  const [accountEmail, setAccountEmail] = useState('')

  useEffect(() => {
    fetchCodes()
    createClient().auth.getUser().then(({ data }) => setAccountEmail(data.user?.email ?? ''))
  }, [])

  async function fetchCodes() {
    const res = await fetch('/api/codes')
    if (res.ok) {
      const data: Code[] = await res.json()
      setCodes(data)
      // 各コードのスキャン数を取得
      const counts: Record<string, number> = {}
      await Promise.all(
        data.map(async (code) => {
          const r = await fetch(`/api/codes/${code.id}/scans`)
          if (r.ok) {
            const scans = await r.json()
            counts[code.id] = scans.length
          }
        })
      )
      setScanCounts(counts)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('このコードを削除しますか？スキャン履歴も削除されます。')) return
    setDeleting(id)
    const res = await fetch(`/api/codes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCodes((prev) => prev.filter((c) => c.id !== id))
    }
    setDeleting(null)
  }

  async function handleToggleNotification(id: string, current: boolean) {
    setTogglingId(id)
    const res = await fetch(`/api/codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_enabled: !current }),
    })
    if (res.ok) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, notification_enabled: !current } : c)))
    }
    setTogglingId(null)
  }

  async function handleBulkToggle(enabled: boolean) {
    setBulkToggling(true)
    const res = await fetch('/api/codes/bulk-notify', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    if (res.ok) {
      setCodes((prev) => prev.map((c) => ({ ...c, notification_enabled: enabled })))
    }
    setBulkToggling(false)
  }

  function startRowEdit(code: Code) {
    setEditingRowId(code.id)
    setRowForm({
      category: code.category ?? '',
      cost: code.cost?.toString() ?? '',
      notification_email: code.notification_email ?? '',
    })
  }

  async function handleRowSave(id: string) {
    setRowSaving(true)
    const res = await fetch(`/api/codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: rowForm.category.trim() === '' ? null : rowForm.category.trim(),
        cost: rowForm.cost.trim() === '' ? null : Number(rowForm.cost),
        notification_email: rowForm.notification_email.trim() === '' ? null : rowForm.notification_email.trim(),
      }),
    })
    if (res.ok) {
      const updated: Code = await res.json()
      setCodes((prev) => prev.map((c) => (c.id === id ? updated : c)))
      setEditingRowId(null)
    }
    setRowSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ヘッダー統計 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">登録コード数</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{codes.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">累計読み込み数</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {Object.values(scanCounts).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>

        {/* カテゴリフィルター */}
        {!loading && codes.length > 0 && (() => {
          const categories = Array.from(new Set(codes.map((c) => c.category).filter(Boolean))) as string[]
          if (categories.length === 0) return null
          return (
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                すべて
                <span className="ml-1.5 text-xs opacity-80">({codes.length})</span>
              </button>
              {categories.map((cat) => {
                const count = codes.filter((c) => c.category === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                    <span className="ml-1.5 text-xs opacity-80">({count})</span>
                  </button>
                )
              })}
            </div>
          )
        })()}

        {/* コード一覧 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="font-semibold text-gray-900">二次元コード一覧</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                メール通知をONにしたコードは、読み込みがあった日のみ毎日18時にまとめて1通届きます（即時通知ではありません）。
              </p>
            </div>
            {!loading && codes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">メール通知</span>
                <button
                  onClick={() => handleBulkToggle(true)}
                  disabled={bulkToggling}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  全てON
                </button>
                <button
                  onClick={() => handleBulkToggle(false)}
                  disabled={bulkToggling}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  全てOFF
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">まだ二次元コードがありません</p>
              <Link
                href="/codes/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                最初のコードを作成する
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {codes
                .filter((code) => selectedCategory === 'all' || code.category === selectedCategory)
                .map((code) => {
                const scanCount = scanCounts[code.id] ?? 0
                const isEditing = editingRowId === code.id
                return (
                <div key={code.id}>
                  <div className="flex flex-wrap sm:flex-nowrap items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                    {/* アイコン＋名前ブロック（モバイルは常に全幅で1行目） */}
                    <div className="flex items-start gap-3 min-w-0 basis-full sm:basis-0 sm:flex-1">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 truncate">{code.name}</p>
                          {code.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {code.category}
                            </span>
                          )}
                        </div>
                        {code.memo && <p className="text-sm text-gray-400 truncate">{code.memo}</p>}
                        <p className="hidden sm:block text-xs text-gray-400 mt-0.5 truncate">{getShortUrl(code.short_code)}</p>
                      </div>
                    </div>

                    {/* メタ情報＋操作ブロック（モバイルは2行目に折り返し） */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap basis-full sm:basis-0 sm:w-auto justify-between sm:justify-end">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 w-12">
                        <button
                          onClick={() => handleToggleNotification(code.id, code.notification_enabled)}
                          disabled={togglingId === code.id}
                          title={code.notification_enabled ? 'メール通知ON' : 'メール通知OFF'}
                          className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-60 ${
                            code.notification_enabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              code.notification_enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[10px] text-gray-400">通知</span>
                      </div>
                      <div className="text-right flex-shrink-0 w-20">
                        <p className="text-2xl font-bold text-blue-600 leading-tight">{scanCount}</p>
                        <p className="text-xs text-gray-400">読み込み</p>
                        <p className="text-xs text-gray-400 mt-0.5 h-4">
                          {code.cost != null && (scanCount > 0 ? `単価¥${Math.round(code.cost / scanCount).toLocaleString()}` : '単価—')}
                        </p>
                      </div>
                      <div className="hidden sm:block text-right flex-shrink-0 text-xs text-gray-400 w-24">
                        <p>{formatDate(code.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => (isEditing ? setEditingRowId(null) : startRowEdit(code))}
                          className={`p-2 rounded-lg transition-colors ${
                            isEditing ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title="カテゴリ・投資額・通知先を編集"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <Link
                          href={`/codes/${code.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="アナリティクス"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(code.id)}
                          disabled={deleting === code.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="削除"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">カテゴリ</label>
                          <input
                            type="text"
                            list="dashboard-category-options"
                            value={rowForm.category}
                            onChange={(e) => setRowForm({ ...rowForm, category: e.target.value })}
                            placeholder="例：チラシ、SNS"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">投資額（円）</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={rowForm.cost}
                            onChange={(e) => setRowForm({ ...rowForm, cost: e.target.value })}
                            placeholder="例：30000"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">通知先メール</label>
                          <input
                            type="text"
                            value={rowForm.notification_email}
                            onChange={(e) => setRowForm({ ...rowForm, notification_email: e.target.value })}
                            placeholder={accountEmail || 'example@email.com'}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        投資額はチラシ印刷代や配布費などご自身で管理するための金額です。当社へのお支払いとは関係なく、入力しても課金は発生しません。
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        通知先未設定の場合はアカウントのメールアドレス（{accountEmail}）に届きます。複数指定はカンマ区切り。
                      </p>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => setEditingRowId(null)}
                          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-white"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => handleRowSave(code.id)}
                          disabled={rowSaving}
                          className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1"
                        >
                          {rowSaving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          保存
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>

        <datalist id="dashboard-category-options">
          {Array.from(new Set(codes.map((c) => c.category).filter(Boolean))).map((cat) => (
            <option key={cat} value={cat as string} />
          ))}
        </datalist>
      </main>
    </div>
  )
}
