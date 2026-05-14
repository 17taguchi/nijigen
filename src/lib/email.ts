import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendScanNotification({
  to,
  codeName,
  originalUrl,
  scanCount,
  city,
  country,
}: {
  to: string
  codeName: string
  originalUrl: string
  scanCount: number
  city?: string | null
  country?: string | null
}) {
  const location = [city, country].filter(Boolean).join(', ') || '不明'

  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject: `【二次元コード読み込み通知】${codeName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1d4ed8; margin-bottom: 16px;">二次元コードが読み込まれました</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px;">コード名</td>
            <td style="padding: 8px 0; font-weight: 500;">${codeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">遷移先URL</td>
            <td style="padding: 8px 0;"><a href="${originalUrl}" style="color: #1d4ed8;">${originalUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">累計読み込み数</td>
            <td style="padding: 8px 0; font-weight: 500;">${scanCount}回</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">読み込みエリア</td>
            <td style="padding: 8px 0;">${location}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">日時</td>
            <td style="padding: 8px 0;">${new Date().toLocaleString('ja-JP')}</td>
          </tr>
        </table>
      </div>
    `,
  })
}
