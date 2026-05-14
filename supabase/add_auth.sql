-- user_id 列を追加
alter table codes add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 既存データがあれば削除（テスト用データなので問題なし）
delete from codes;

-- user_id を必須にする
alter table codes alter column user_id set not null;

-- RLS を有効化
alter table codes enable row level security;
alter table scans enable row level security;

-- codes: 自分のコードだけ操作可能
create policy "codes_user_policy" on codes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- scans: 自分のコードのスキャンだけ参照可能（書き込みはservice_roleが行う）
create policy "scans_select_policy" on scans
  for select
  using (
    exists (
      select 1 from codes
      where codes.id = scans.code_id
        and codes.user_id = auth.uid()
    )
  );
