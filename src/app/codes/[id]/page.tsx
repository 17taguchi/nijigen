'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import {
  format, subDays, subMonths, subYears, addDays, addMonths,
  eachDayOfInterval, eachMonthOfInterval,
  startOfDay, endOfDay, startOfMonth, endOfMonth,
  differenceInDays,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import Navbar from '@/components/Navbar'
import { Code, Scan } from '@/lib/supabase/types'
import { getShortUrl, formatDateTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'

const PRESET_COLORS = [
  { label: '黒', value: '#000000' },
  { label: '紺', value: '#1e3a8a' },
  { label: '赤', value: '#dc2626' },
  { label: '緑', value: '#16a34a' },
  { label: '紫', value: '#7c3aed' },
]

type Preset = '7d' | '14d' | '30d' | '90d' | '1y' | 'custom'
type CompareMode = 'none' | 'prev' | 'lastyear'
type ChartType = 'daily' | 'monthly' | 'hourly'

function toDateString(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function scansInRange(scans: Scan[], start: Date, end: Date) {
  return scans.filter((s) => {
    const d = new Date(s.scanned_at)
    return d >= startOfDay(start) && d <= endOfDay(end)
  })
}

export default function CodeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [code, setCode] = useState<Code | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', memo: '', cost: '', category: '', notification_email: '' })
  const [accountEmail, setAccountEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'analytics' | 'settings'>('analytics')
  const [chartType, setChartType] = useState<ChartType>('daily')
  const [qrColor, setQrColor] = useState('#000000')

  // 期間選択
  const [preset, setPreset] = useState<Preset>('14d')
  const [rangeStart, setRangeStart] = useState<Date>(subDays(new Date(), 13))
  const [rangeEnd, setRangeEnd] = useState<Date>(new Date())
  const [customStart, setCustomStart] = useState(toDateString(subDays(new Date(), 13)))
  const [customEnd, setCustomEnd] = useState(toDateString(new Date()))
  const [compareMode, setCompareMode] = useState<CompareMode>('none')

  function applyPreset(p: Preset) {
    setPreset(p)
    const today = new Date()
    if (p === '7d')   { setRangeStart(subDays(today, 6));   setRangeEnd(today) }
    if (p === '14d')  { setRangeStart(subDays(today, 13));  setRangeEnd(today) }
    if (p === '30d')  { setRangeStart(subDays(today, 29));  setRangeEnd(today) }
    if (p === '90d')  { setRangeStart(subDays(today, 89));  setRangeEnd(today) }
    if (p === '1y')   { setRangeStart(subDays(today, 364)); setRangeEnd(today) }
  }

  function applyCustom() {
    const s = new Date(customStart)
    const e = new Date(customEnd)
    if (s <= e) { setRangeStart(s); setRangeEnd(e) }
  }

  // 比較期間を計算
  const spanDays = differenceInDays(rangeEnd, rangeStart)
  const compareStart = compareMode === 'lastyear'
    ? subYears(rangeStart, 1)
    : subDays(rangeStart, spanDays + 1)
  const compareEnd = compareMode === 'lastyear'
    ? subYears(rangeEnd, 1)
    : subDays(rangeStart, 1)

  const mainScans = scansInRange(scans, rangeStart, rangeEnd)
  const cmpScans = compareMode !== 'none' ? scansInRange(scans, compareStart, compareEnd) : []

  // グラフデータ生成
  const barData = (() => {
    if (chartType === 'monthly') {
      const months = eachMonthOfInterval({ start: startOfMonth(rangeStart), end: startOfMonth(rangeEnd) })
      return months.map((month, i) => {
        const cmpMonth = compareMode === 'lastyear'
          ? subYears(month, 1)
          : addMonths(startOfMonth(compareStart), i)
        return {
          label: format(month, 'M月', { locale: ja }),
          count: scans.filter((s) => { const d = new Date(s.scanned_at); return d >= startOfMonth(month) && d <= endOfMonth(month) }).length,
          compare: compareMode !== 'none'
            ? scans.filter((s) => { const d = new Date(s.scanned_at); return d >= startOfMonth(cmpMonth) && d <= endOfMonth(cmpMonth) }).length
            : 0,
        }
      })
    }
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    return days.map((day, i) => {
      const cmpDay = compareMode === 'lastyear' ? subYears(day, 1) : addDays(compareStart, i)
      return {
        label: format(day, 'M/d', { locale: ja }),
        count: scansInRange(scans, day, day).length,
        compare: compareMode !== 'none' ? scansInRange(scans, cmpDay, cmpDay).length : 0,
      }
    })
  })()

  const lineData = (() => {
    const mainDays = Math.max(new Set(mainScans.map((s) => format(new Date(s.scanned_at), 'yyyy-MM-dd'))).size, 1)
    const cmpDays  = Math.max(new Set(cmpScans.map((s) => format(new Date(s.scanned_at), 'yyyy-MM-dd'))).size, 1)
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h}時`,
      avg: Math.round((mainScans.filter((s) => new Date(s.scanned_at).getHours() === h).length / mainDays) * 10) / 10,
      compareAvg: compareMode !== 'none'
        ? Math.round((cmpScans.filter((s) => new Date(s.scanned_at).getHours() === h).length / cmpDays) * 10) / 10
        : 0,
    }))
  })()

  const areaData = (() => {
    const counts: Record<string, number> = {}
    mainScans.forEach((s) => {
      const area = [s.city, s.region, s.country].filter(Boolean).join(' / ') || '不明'
      counts[area] = (counts[area] ?? 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([area, count]) => ({ area, count }))
  })()

  const compareLabel = compareMode === 'lastyear'
    ? `前年同期 (${format(compareStart, 'M/d')}–${format(compareEnd, 'M/d', { locale: ja })})`
    : `前の期間 (${format(compareStart, 'M/d')}–${format(compareEnd, 'M/d', { locale: ja })})`

  const generateQR = useCallback(async (url: string, color: string) => {
    if (!canvasRef.current) return
    await QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 2,
      color: { dark: color, light: '#ffffff' },
    })
  }, [])

  const refreshScans = useCallback(async () => {
    setRefreshing(true)
    const res = await fetch(`/api/codes/${id}/scans`)
    const data: Scan[] = await res.json()
    setScans(data)
    setRefreshing(false)
  }, [id])

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
        cost: codeData.cost?.toString() ?? '',
        category: codeData.category ?? '',
        notification_email: codeData.notification_email ?? '',
      })
      setLoading(false)
      setTimeout(() => generateQR(getShortUrl(codeData.short_code), '#000000'), 100)
    }
    load()
    createClient().auth.getUser().then(({ data }) => setAccountEmail(data.user?.email ?? ''))
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
      body: JSON.stringify({
        name: editForm.name,
        memo: editForm.memo,
        cost: editForm.cost.trim() === '' ? null : Number(editForm.cost),
        category: editForm.category.trim() === '' ? null : editForm.category.trim(),
        notification_email: editForm.notification_email.trim() === '' ? null : editForm.notification_email.trim(),
      }),
    })
    if (res.ok) {
      const updated: Code = await res.json()
      setCode(updated)
      setEditing(false)
      setSaveError('')
    } else {
      const { error } = await res.json().catch(() => ({ error: '保存に失敗しました' }))
      setSaveError(error ?? '保存に失敗しました')
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

  const PRESETS: { key: Preset; label: string }[] = [
    { key: '7d', label: '7日' },
    { key: '14d', label: '14日' },
    { key: '30d', label: '30日' },
    { key: '90d', label: '90日' },
    { key: '1y', label: '1年' },
    { key: 'custom', label: 'カスタム' },
  ]

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
            {activeTab === 'analytics' && (
              <button
                onClick={refreshScans}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
                title="最新データに更新"
              >
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${refreshing ? 'animate-spin' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">{refreshing ? '更新中...' : '最新データに更新'}</span>
              </button>
            )}
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
            <div className="bg-blue-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80">累計読み込み数</p>
              <p className="text-5xl font-bold mt-1">{scans.length}</p>
              {compareMode !== 'none' && (
                <div className="mt-3 pt-3 border-t border-blue-500 flex gap-4 text-sm">
                  <div>
                    <p className="opacity-70">選択期間</p>
                    <p className="font-semibold">{mainScans.length}回</p>
                  </div>
                  <div>
                    <p className="opacity-70">比較期間</p>
                    <p className="font-semibold">{cmpScans.length}回</p>
                  </div>
                </div>
              )}
              {code.cost != null && (
                <div className="mt-3 pt-3 border-t border-blue-500 text-sm">
                  <p className="opacity-70">読み込み単価（選択期間）</p>
                  <p className="font-semibold">
                    {mainScans.length > 0
                      ? `¥${Math.round(code.cost / mainScans.length).toLocaleString()} / 件`
                      : '読み込みなし'}
                  </p>
                  <p className="opacity-60 text-xs mt-0.5">投資額 ¥{code.cost.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* 右カラム：アナリティクス or 設定 */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === 'analytics' ? (
              <>
                {/* 期間選択 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                  {/* プリセット */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium flex-shrink-0">表示期間</span>
                    <div className="overflow-x-auto scrollbar-none">
                      <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium w-max">
                        {PRESETS.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => applyPreset(key)}
                            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                              preset === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* カスタム日付 */}
                  {preset === 'custom' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="flex-1 min-w-0 text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-400 text-sm flex-shrink-0">〜</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="flex-1 min-w-0 text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={applyCustom}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        適用
                      </button>
                    </div>
                  )}

                  {/* 比較 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium">比較</span>
                    {(['none', 'prev', 'lastyear'] as CompareMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setCompareMode(m)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          compareMode === m
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {m === 'none' ? 'なし' : m === 'prev' ? '前の期間' : '前年同期'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* グラフ */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {chartType === 'daily' ? '日別' : chartType === 'monthly' ? '月別' : '時間帯別平均'}読み込み数
                      </h3>
                      {compareMode !== 'none' && (
                        <p className="text-xs text-gray-400 mt-0.5">灰色：{compareLabel}</p>
                      )}
                    </div>
                    <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
                      {(['daily', 'monthly', 'hourly'] as ChartType[]).map((t) => (
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

                  <ResponsiveContainer width="100%" height={220}>
                    {chartType === 'hourly' ? (
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v, name) => [`${v}回`, name === 'avg' ? '選択期間' : '比較期間']} />
                        {compareMode !== 'none' && <Legend formatter={(v) => v === 'avg' ? '選択期間' : '比較期間'} />}
                        <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        {compareMode !== 'none' && (
                          <Line type="monotone" dataKey="compareAvg" stroke="#d1d5db" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                        )}
                      </LineChart>
                    ) : (
                      <BarChart data={barData} barSize={compareMode !== 'none' ? 10 : 16} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip formatter={(v, name) => [`${v}回`, name === 'count' ? '選択期間' : '比較期間']} />
                        {compareMode !== 'none' && <Legend formatter={(v) => v === 'count' ? '選択期間' : '比較期間'} />}
                        <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        {compareMode !== 'none' && (
                          <Bar dataKey="compare" fill="#d1d5db" radius={[3, 3, 0, 0]} />
                        )}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* エリア */}
                {areaData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">読み込みエリア（選択期間）</h3>
                    <div className="space-y-2">
                      {areaData.map(({ area, count }) => (
                        <div key={area} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-48 truncate">{area}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(count / mainScans.length) * 100}%` }}
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

                  {saveError && (
                    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      保存に失敗しました：{saveError}
                    </div>
                  )}

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ <span className="text-gray-400 font-normal">（任意）</span>
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        placeholder="例：チラシ、SNS、看板"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{code.category || '未分類'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      投資額 <span className="text-gray-400 font-normal">（任意・円）</span>
                    </label>
                    <p className="text-xs text-gray-400 mb-1.5">
                      チラシ印刷代や配布費など、ご自身で管理するための金額です。当社へのお支払いとは関係なく、入力しても課金は発生しません。
                    </p>
                    {editing ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editForm.cost}
                        onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                        placeholder="例：30000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{code.cost != null ? `¥${code.cost.toLocaleString()}` : '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メール通知の宛先 <span className="text-gray-400 font-normal">（任意）</span>
                    </label>
                    <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 space-y-1">
                      <p>・通知はダッシュボードのトグルでON/OFFを切り替えます（この設定タブでは宛先のみ変更できます）</p>
                      <p>・読み込みがあった日のみ、毎日18時に1日分をまとめて1通送信します（即時通知ではありません）</p>
                    </div>
                    {editing ? (
                      <>
                        <input
                          type="text"
                          value={editForm.notification_email}
                          onChange={(e) => setEditForm({ ...editForm, notification_email: e.target.value })}
                          placeholder={accountEmail || 'example@email.com'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          未設定の場合はアカウントのメールアドレス（{accountEmail}）に届きます。複数指定する場合はカンマで区切ってください。
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-900">{code.notification_email || `${accountEmail}（デフォルト）`}</p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 flex items-center justify-between">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    名前・メモ・カテゴリ・投資額・通知先を編集
                  </button>
                  {editing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(false); setEditForm({ name: code.name, memo: code.memo ?? '', cost: code.cost?.toString() ?? '', category: code.category ?? '', notification_email: code.notification_email ?? '' }) }}
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
