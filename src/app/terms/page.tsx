import Link from 'next/link'

export default function TermsPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">利用規約</h1>
          <p className="text-sm text-gray-400 mb-8">最終更新日：2026年5月14日</p>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">第1条（適用）</h2>
              <p>本規約は、株式会社ジュウナナワーク（以下「当社」）が提供する「二次元コード管理ツール」（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意のうえ、本サービスをご利用ください。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">第2条（利用登録）</h2>
              <p>本サービスの利用を希望する方は、当社の定める方法によりアカウントを登録することで、ユーザーとなります。登録情報に虚偽・誤りがあった場合、利用を停止することがあります。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">第3条（禁止事項）</h2>
              <p>ユーザーは以下の行為を行ってはなりません。</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスのサーバーやネットワークに過大な負荷をかける行為</li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>他のユーザーまたは第三者を誹謗中傷する行為</li>
                <li>不正アクセスまたはこれを試みる行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">第4条（本サービスの提供の停止等）</h2>
              <p>当社は、以下のいずれかに該当する場合、ユーザーへの事前通知なく本サービスの全部または一部を停止・中断することがあります。</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>本サービスにかかるシステムの保守・点検を行う場合</li>
                <li>地震・落雷・停電などの不可抗力により、本サービスの提供が困難な場合</li>
                <li>その他、当社が本サービスの停止・中断を必要と判断した場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">第5条（免責事項）</h2>
              <p>当社は本サービスに関して、ユーザーに生じたあらゆる損害について一切の責任を負いません。また、本サービスの提供の中断・停止・終了・変更により生じた損害についても同様とします。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">第6条（サービス内容の変更等）</h2>
              <p>当社はユーザーへの事前通知なく、本サービスの内容を変更・追加・廃止することがあります。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">第7条（利用規約の変更）</h2>
              <p>当社は必要に応じて、本規約を変更することがあります。変更後の利用規約は本サービス上に表示した時点より効力を生じます。</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-2">第8条（準拠法・裁判管轄）</h2>
              <p>本規約の解釈にあたっては日本法を準拠法とし、本サービスに関する紛争については当社の所在地を管轄する裁判所を専属的合意管轄とします。</p>
            </section>

            <section>
              <p className="text-right text-sm text-gray-500">株式会社ジュウナナワーク</p>
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
