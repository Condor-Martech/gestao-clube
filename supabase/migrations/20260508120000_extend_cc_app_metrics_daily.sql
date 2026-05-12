-- Extends cc_app_metrics_daily with country/device dimensions and install metrics
-- for the Play Developer Reporting API path. Replaces the existing unique
-- constraint so multiple rows per (app, store, date) are allowed — one per
-- (country_code, device_type) combination, with NULL meaning "aggregate / all".

alter table public.cc_app_metrics_daily
  drop constraint if exists cc_app_metrics_daily_app_id_store_date_key;

alter table public.cc_app_metrics_daily
  add column if not exists country_code text,
  add column if not exists device_type  text,
  add column if not exists installs     integer,
  add column if not exists uninstalls   integer;

alter table public.cc_app_metrics_daily
  add constraint cc_app_metrics_daily_unique_dim
  unique nulls not distinct (app_id, store, date, country_code, device_type);

create index if not exists cc_app_metrics_daily_app_country_device_date_idx
  on public.cc_app_metrics_daily (app_id, store, country_code, device_type, date desc);
