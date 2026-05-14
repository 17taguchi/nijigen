import { ImageResponse } from 'next/og'

export const alt = '二次元コード管理ツール'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
        <div style={{ fontSize: 64, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 28 }}>
          二次元コード管理ツール
        </div>
        <div style={{ fontSize: 34, color: 'rgba(255,255,255,0.85)', marginBottom: 56 }}>
          チラシ配布の効果を、数字で見える化
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 100, padding: '12px 28px', color: 'white', fontSize: 22 }}>
            二次元コード生成
          </div>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 100, padding: '12px 28px', color: 'white', fontSize: 22 }}>
            読み込み回数を計測
          </div>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 100, padding: '12px 28px', color: 'white', fontSize: 22 }}>
            エリア分析
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 60, right: 100, color: 'rgba(255,255,255,0.55)', fontSize: 24 }}>
          nijigen.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}
