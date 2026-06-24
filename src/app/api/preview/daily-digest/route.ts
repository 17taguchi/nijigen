import { NextResponse } from 'next/server'
import { buildDailyDigestHtml } from '@/lib/email'

// 実際にメールを送らず、デザインだけブラウザで確認するためのサンプルプレビュー
export async function GET() {
  const html = buildDailyDigestHtml({
    scans: [
      { codeName: 'カブサー鶴見緑校チラシ', area: '横浜市 / 神奈川県 / 日本', scannedAt: new Date().toISOString() },
      { codeName: 'カブサー鶴見緑校チラシ', area: '川崎市 / 神奈川県 / 日本', scannedAt: new Date(Date.now() - 3600_000).toISOString() },
      { codeName: 'さちこんぶ｜総合進学塾KGC新金岡校', area: '堺市 / 大阪府 / 日本', scannedAt: new Date(Date.now() - 7200_000).toISOString() },
    ],
    codeStats: [
      { name: 'カブサー鶴見緑校チラシ', d3: 5, d7: 12, d28: 30, d60: 48 },
      { name: 'さちこんぶ｜総合進学塾KGC新金岡校', d3: 1, d7: 3, d28: 9, d60: 15 },
    ],
  })

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
