import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '二次元コード管理ツール'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 100px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* アイコン */}
        <div
          style={{
            width: 80,
            height: 80,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 36,
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>

        {/* タイトル */}
        <div style={{ fontSize: 60, fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: 24 }}>
          二次元コード管理ツール
        </div>

        {/* キャッチコピー */}
        <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.85)', marginBottom: 48 }}>
          チラシ配布の効果を、数字で見える化
        </div>

        {/* 特徴タグ */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['二次元コード生成', '読み込み回数を計測', 'エリア分析'].map((label) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 100,
                padding: '10px 24px',
                color: 'white',
                fontSize: 20,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ position: 'absolute', bottom: 60, right: 100, color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>
          nijigen.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
