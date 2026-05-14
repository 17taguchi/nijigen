import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">二次元コード管理</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
          <p className="text-sm text-gray-400 mb-8">最終更新日：2026年5月14日</p>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">1. 運営者情報</h2>
              <p>株式会社ジュウナナワーク（以下「当社」）は、本サービス「二次元コード管理ツール」（以下「本サービス」）におけるユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">2. 収集する情報</h2>
              <p>本サービスでは、以下の情報を収集します。</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>アカウント登録時のメールアドレス</li>
                <li>二次元コードが読み込まれた際のIPアドレス</li>
                <li>IPアドレスから推定される概算の位置情報（国・都道府県・市区町村）</li>
                <li>二次元コードを読み込んだ端末のユーザーエージェント情報</li>
                <li>読み込み日時</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">3. 情報の利用目的</h2>
              <p>収集した情報は、以下の目的にのみ使用します。</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>本サービスのアナリティクス機能（読み込み回数・エリア集計）の提供</li>
                <li>本サービスの運営・改善</li>
                <li>お問い合わせへの対応</li>
              </ul>
              <p className="mt-2 font-medium">収集した情報を第三者に販売・提供することはありません。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">4. 位置情報について</h2>
              <p>IPアドレスからの位置情報の推定は外部APIを使用しており、市区町村レベルの精度は保証されません。また、取得する位置情報はあくまで概算であり、個人を特定するものではありません。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">5. データの保管と削除</h2>
              <p>収集したデータはSupabase（Supabase, Inc.）のサーバーに保管されます。アカウントを削除した場合、関連するすべてのデータ（コード情報・スキャン履歴）は即座に削除されます。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">6. Cookieについて</h2>
              <p>本サービスでは、ログイン状態の維持のためにCookieを使用します。広告目的のCookieは使用していません。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">7. お問い合わせ</h2>
              <p>プライバシーポリシーに関するお問い合わせは、株式会社ジュウナナワークまでご連絡ください。</p>
            </section>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">← ログインページに戻る</Link>
        </div>
      </main>
    </div>
  )
}
