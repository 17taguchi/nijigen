'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import { Code } from '@/lib/supabase/types'
import { formatDateTime } from '@/lib/utils'

type Notification = {
  id: string
  code_name: string
  code_id: string
  scanned_at: string
  area: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [codes, setCodes] = useState<Code[]>([])
  const [selectedCodeId, setSelectedCodeId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const fetchPage = useCallback(async (offset: number) => {
    const res = await fetch(`/api/notifications?offset=${offset}`)
    const data = await res.json()
    return data as { items: Notification[]; hasMore: boolean }
  }, [])

  useEffect(() => {
    Promise.all([
      fetchPage(0),
      fetch('/api/codes').then((r) => r.json()),
    ]).then(([{ items, hasMore }, codeList]) => {
      setNotifications(items)
      setHasMore(hasMore)
      offsetRef.current = items.length
      setCodes(codeList)
      setLoading(false)
    })
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const { items, hasMore: more } = await fetchPage(offsetRef.current)
    setNotifications((prev) => [...prev, ...items])
    setHasMore(more)
    offsetRef.current += items.length
    setLoadingMore(false)
  }, [loadingMore, hasMore, fetchPage])

  useEffect(() => {
    if (loading) return
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [loading, loadMore])

  const filtered = selectedCodeId === 'all'
    ? notifications
    : notifications.filter((n) => n.code_id === selectedCodeId)

  const totalForCode = (codeId: string) =>
    notifications.filter((n) => n.code_id === codeId).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">読み込み通知</h1>
          <p className="text-gray-500 mt-1 text-sm">二次元コードが読み込まれた履歴</p>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setSelectedCodeId('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCodeId === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            すべて
            <span className="ml-1.5 text-xs opacity-80">({notifications.length}{hasMore ? '+' : ''})</span>
          </button>
          {codes.map((code) => {
            const count = totalForCode(code.id)
            return (
              <button
                key={code.id}
                onClick={() => setSelectedCodeId(code.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCodeId === code.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {code.name}
                <span className="ml-1.5 text-xs opacity-80">({count})</span>
              </button>
            )
          })}
        </div>

        {/* 一覧 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">まだ読み込みがありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((n) => (
                <div key={n.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{n.code_name}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{n.area}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{formatDateTime(n.scanned_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 無限スクロール sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!hasMore && notifications.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-4">すべての履歴を表示しました</p>
        )}
      </main>
    </div>
  )
}
