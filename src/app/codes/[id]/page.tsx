'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import Navbar from '@/components/Navbar'
import { Code, Scan } from '@/lib/supabase/types'
import { getShortUrl, formatDateTime } from '@/lib/utils'

const PRESET_COLORS = [
  { label: '黒', value: '#000000' },
  { label: '紺', value: '#1e3a8a' },
  { label: '赤', value: '#dc2626' },
  { label: '緑', value: '#16a34a' },
  { label: '紫', value: '#7c3aed' },
]

export default function CodeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [code, setCode] = useState<Code | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', memo: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'analytics' | 'settings'>('analytics')
  const [chartType, setChartType] = useState<'daily' | 'monthly' | 'hourly'>('daily')
  const [qrColor, setQrColor] = useState('#000000')

  const generateQR = useCallback(async (url: string, color: string) => {
    if (!canvasRef.current) return
    await QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 2,
      color: { dark: color, light: '#ffffff' },
    })
  }, [])

  useEffect(() => {
    async function load() {
      const [codeRes, scansRes] = await Promise.all([
        fetch(`/api/codes/${id}`),
        fetch(`/api/codes/${id}/scans`),
      ])
      if (!codeRes.ok) { router.push('/'); return }
      const codeData: Code = await codeRes.json()
      const scansData: Scan[] = await scansRes.json()
      setCode(codeData)
      setScans(scansData)
      setEditForm({
        name: codeData.name,
        memo: codeData.memo ?? '',
      })
      setLoading(false)
      setTimeout(() => generateQR(getShortUrl(codeData.short_code), '#000000'), 100)
    }
    load()
  }, [id, router, generateQR])

  useEffect(() => {
    if (!code) return
    generateQR(getShortUrl(code.short_code), qrColor)
  }, [qrColor, code, generateQR])

  async function handleSave() {
    if (!code) return
    setSaving(true)
    const res = await fetch(`/api/codes/${code.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated: Code = await res.json()
      setCode(updated)
      setEditing(false)
    }
    setSaving(false)
  }

  function downloadQR() {
    if (!canvasRef.current || !code) return
    const link = document.createElement('a')
    link.download = `${code.name}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  // グラフデータ生成
  const dailyData = (() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() })
    return days.map((day) => ({
      label: format(day, 'M/d', { locale: ja }),
      count: scans.filter((s) => {
        const d = new Date(s.scanned_at)
        return d >= startOfDay(day) && d <= endOfDay(day)
      }).length,
    }))
  })()

  const monthlyData = (() => {
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() })
    return months.map((month) => ({
      label: format(month, 'M月', { locale: ja }),
      count: scans.filter((s) => {
        const d = new Date(s.scanned_at)
        return d >= startOfMonth(month) && d <= endOfMonth(month)
      }).length,
    }))
  })()

  const hourlyData = (() => {
    const daySet = new Set(scans.map((s) => format(new Date(s.scanned_at), 'yyyy-MM-dd')))
    const totalDays = Math.max(daySet.size, 1)
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h}時`,
      avg: Math.round(
        (scans.filter((s) => new Date(s.scanned_at).getHours() === h).length / totalDays) * 10
      ) / 10,
    }))
  })()

  const areaData = (() => {
    const counts: Record<string, number> = {}
    scans.forEach((s) => {
      const area = [s.city, s.region, s.country].filter(Boolean).join(' / ') || '不明'
      counts[area] = (counts[area] ?? 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([area, count]) => ({ area, count }))
  })()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!code) return null

  const shortUrl = getShortUrl(code.short_code)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">ダッシュボード</Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm text-gray-700">{code.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{code.name}</h1>
            {code.memo && <p className="text-gray-500 mt-0.5">{code.memo}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab(activeTab === 'settings' ? 'analytics' : 'settings')}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {activeTab === 'settings' ? 'アナリティクス' : '設定'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム：二次元コード */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center">
              <canvas ref={canvasRef} className="rounded-lg" />

              {/* カラーピッカー */}
              <div className="mt-4 w-full">
                <p className="text-xs text-gray-500 mb-2">コードの色</p>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setQrColor(c.value)}
                      title={c.label}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        qrColor === c.value ? 'border-gray-400 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  <label className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden" title="カスタム色">
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="opacity-0 absolute w-px h-px"
                    />
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                </div>
              </div>

              <button
                onClick={downloadQR}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PNG でダウンロード
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">短縮URL</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded flex-1 truncate">{shortUrl}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(shortUrl)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                  title="コピー"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 truncate">→ {code.original_url}</p>
            </div>

            {/* 合計スキャン数 */}
            <div className="bg-blue-600 rounded-xl p-5 text-white text-center">
              <p className="text-sm opacity-80">累計読み込み数</p>
              <p className="text-5xl font-bold mt-1">{scans.length}</p>
            </div>
          </div>

          {/* 右カラム：アナリティクス or 設定 */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === 'analytics' ? (
              <>
                {/* グラフ */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">
                      {chartType === 'daily' && '日別読み込み数（直近14日）'}
                      {chartType === 'monthly' && '月別読み込み数（直近12ヶ月）'}
                      {chartType === 'hourly' && '時間帯別平均読み込み数（全期間）'}
                    </h3>
                    <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
                      {(['daily', 'monthly', 'hourly'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setChartType(t)}
                          className={`px-3 py-1.5 rounded-md transition-colors ${
                            chartType === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {t === 'daily' ? '日別' : t === 'monthly' ? '月別' : '時間帯'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    {chartType === 'hourly' ? (
                      <LineChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [`${v}回`, '平均読み込み数']} />
                        <Line type="monotone" dataKey="avg" name="平均" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    ) : (
                      <BarChart data={chartType === 'daily' ? dailyData : monthlyData} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip formatter={(v) => [`${v}回`, '読み込み数']} />
                        <Bar dataKey="count" name="読み込み数" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* エリア */}
                {areaData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">読み込みエリア</h3>
                    </div>
                    <div className="space-y-2">
                      {areaData.map(({ area, count }) => (
                        <div key={area} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-48 truncate">{area}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(count / scans.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      ※ IPアドレスからの推定のため、市区町村レベルの精度は保証されません
                    </p>
                  </div>
                )}

                {/* 最近のスキャン */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">最近の読み込み</h3>
                  </div>
                  {scans.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">まだ読み込みがありません</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {scans.slice(0, 10).map((scan) => (
                        <div key={scan.id} className="px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">
                                {[scan.city, scan.region, scan.country].filter(Boolean).join(' / ') || 'エリア不明'}
                              </p>
                              <p className="text-xs text-gray-400">{formatDateTime(scan.scanned_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* 設定タブ */
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                <div className="p-6 space-y-5">
                  <h2 className="font-semibold text-gray-900">コード設定</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">コード名</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{code.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                    {editing ? (
                      <textarea
                        value={editForm.memo}
                        onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{code.memo || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">遷移先URL</label>
                    <p className="text-sm text-blue-700 break-all">{code.original_url}</p>
                  </div>
                </div>

                <div className="px-6 py-4 flex items-center justify-between">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    名前・メモを編集
                  </button>
                  {editing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(false); setEditForm({ name: code.name, memo: code.memo ?? '' }) }}
                        className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1"
                      >
                        {saving && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        保存
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
