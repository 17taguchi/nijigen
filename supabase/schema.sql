-- 二次元コード管理テーブル
create table if not exists codes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  memo text,
  original_url text not null,
  short_code text not null unique,
  notification_enabled boolean not null default false,
  notification_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- スキャン履歴テーブル
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references codes(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  country text,
  region text,
  city text
);

-- インデックス
create index if not exists scans_code_id_idx on scans(code_id);
create index if not exists scans_scanned_at_idx on scans(scanned_at);
create index if not exists codes_short_code_idx on codes(short_code);

-- updated_at 自動更新
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger codes_updated_at
  before update on codes
  for each row execute function update_updated_at();

-- RLS（Row Level Security）は無効にしてservice_role経由でのみアクセス
alter table codes disable row level security;
alter table scans disable row level security;
