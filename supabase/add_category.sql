-- コードのカテゴリ分け（任意）。既存コードは NULL（未分類）になる。
alter table codes add column if not exists category text;
