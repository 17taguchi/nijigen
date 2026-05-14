# 二次元コード管理ツール

チラシ配布の効果測定ができる二次元コード管理ツール。URLを入力すると二次元コードが生成され、読み込み状況をアナリティクスで確認できます。

## セットアップ

### 1. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) でアカウント作成・プロジェクト作成
2. `supabase/schema.sql` の内容を Supabase の SQL Editor で実行
3. Project Settings > API から以下の値を取得：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Resend API キーの取得

1. [Resend](https://resend.com) でアカウント作成
2. API Keys から API キーを発行
3. Domains でドメインを追加・認証（`src/lib/email.ts` の `from` アドレスを更新）

### 3. 環境変数の設定

`.env.local` を編集：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
RESEND_API_KEY=re_...
```

### 4. 起動

```bash
npm install
npm run dev
```

## 機能

- **二次元コード生成** — URLを入力してコードを生成、PNG でダウンロード可能
- **アナリティクス** — 日別・時間帯別の読み込み数グラフ、エリア別集計
- **メール通知** — 読み込み時にメールで通知（Resend 使用）
- **短縮URL** — 各コードにユニークな短縮URLを自動生成

## 仕組み

```
ユーザーが二次元コードを読み込む
  → /r/{shortCode} にアクセス
  → スキャン情報を Supabase に記録
  → （通知ONの場合）Resend でメール送信
  → 元のURLにリダイレクト
```

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Resend (メール送信)
- Recharts (グラフ)
- qrcode (二次元コード生成)
