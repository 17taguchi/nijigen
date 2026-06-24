import { Resend } from 'resend'

type DigestParams = {
  scans: { codeName: string; area: string; scannedAt: string }[]
  codeStats: { name: string; d3: number; d7: number; d28: number; d60: number }[]
}

export function buildDailyDigestHtml({ scans, codeStats }: DigestParams) {
  const scanRows = scans
    .map(
      (s) => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0;">${s.codeName}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${s.area}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; color: #6b7280;">${new Date(s.scannedAt).toLocaleString('ja-JP')}</td>
    </tr>`
    )
    .join('')

  const statRows = codeStats
    .map(
      (c) => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-weight: 500;">${c.name}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">${c.d3}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">${c.d7}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">${c.d28}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">${c.d60}</td>
    </tr>`
    )
    .join('')

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1d4ed8; margin-bottom: 8px;">本日の読み込みレポート</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">過去24時間で ${scans.length}件 の読み込みがありました。</p>

      <h3 style="font-size: 14px; color: #111827; margin-bottom: 8px;">読み込み履歴</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 6px 8px; text-align: left;">コード名</th>
            <th style="padding: 6px 8px; text-align: left;">エリア</th>
            <th style="padding: 6px 8px; text-align: left;">時刻</th>
          </tr>
        </thead>
        <tbody>${scanRows}</tbody>
      </table>

      <h3 style="font-size: 14px; color: #111827; margin-bottom: 8px;">コード別 読み込み数</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 6px 8px; text-align: left;">コード名</th>
            <th style="padding: 6px 8px;">3日</th>
            <th style="padding: 6px 8px;">7日</th>
            <th style="padding: 6px 8px;">28日</th>
            <th style="padding: 6px 8px;">60日</th>
          </tr>
        </thead>
        <tbody>${statRows}</tbody>
      </table>

      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">このメールは二次元コード管理ツールから自動送信されています。</p>
    </div>
  `
}

export async function sendDailyDigest({
  to,
  scans,
  codeStats,
}: DigestParams & { to: string }) {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to,
    subject: `【二次元コード】本日 ${scans.length}件の読み込みがありました`,
    html: buildDailyDigestHtml({ scans, codeStats }),
  })
}
