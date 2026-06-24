-- コードごとの投資額（任意）。設定された場合のみ単価計算に使用する。
alter table codes add column if not exists cost numeric;
