import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Footer from '@/components/Footer'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '二次元コード管理ツール',
  description: 'URLを二次元コードに変換して配布するだけ。日別・月別・エリア別の読み込み状況をリアルタイムで把握できます。',
  metadataBase: new URL('https://nijigen.vercel.app'),
  openGraph: {
    title: '二次元コード管理ツール',
    description: 'URLを二次元コードに変換して配布するだけ。日別・月別・エリア別の読み込み状況をリアルタイムで把握できます。',
    url: 'https://nijigen.vercel.app',
    siteName: '二次元コード管理ツール',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '二次元コード管理ツール',
    description: 'URLを二次元コードに変換して配布するだけ。日別・月別・エリア別の読み込み状況をリアルタイムで把握できます。',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.className} h-full`}>
      <body className="min-h-full bg-gray-50 flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  )
}
