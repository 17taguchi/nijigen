'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Code } from '@/lib/supabase/types'
import { formatDate, getShortUrl } from '@/lib/utils'

export default function DashboardPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [scanCounts, setScanCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchCodes()
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ヘッダー統計 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
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
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-sm text-gray-500">通知設定済み</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {codes.filter((c) => c.notification_enabled).length}
            </p>
          </div>
        </div>

        {/* コード一覧 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">二次元コード一覧</h2>
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
              {codes.map((code) => (
                <div key={code.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{code.name}</p>
                      {code.notification_enabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                          通知ON
                        </span>
                      )}
                    </div>
                    {code.memo && <p className="text-sm text-gray-400 truncate">{code.memo}</p>}
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{getShortUrl(code.short_code)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-blue-600">{scanCounts[code.id] ?? 0}</p>
                    <p className="text-xs text-gray-400">読み込み</p>
                  </div>
                  <div className="hidden sm:block text-right flex-shrink-0 text-xs text-gray-400">
                    <p>{formatDate(code.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
