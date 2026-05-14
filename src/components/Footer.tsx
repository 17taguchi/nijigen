import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-400">© 株式会社ジュウナナワーク</p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">利用規約</Link>
          <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">プライバシーポリシー</Link>
        </div>
      </div>
    </footer>
  )
}
