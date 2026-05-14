import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Footer from '@/components/Footer'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '二次元コード管理ツール',
  description: 'チラシ配布の効果測定ができる二次元コード管理ツール',
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
