-- Clube Condor Stores Intelligence
-- Adds tables for tracking app metadata, daily metrics, reviews, and AI analyses
-- across Google Play and App Store. All objects are prefixed `cc_` to namespace
-- them under "Clube Condor" and avoid collisions with the legacy
-- (campanha/produto/banner/loja/...) schema.
--
-- The sync service writes via service-role (bypass RLS); reads are open to
-- authenticated users (same pattern as pipelines).

create extension if not exists "moddatetime";

-- ============================================================
-- cc_apps: registered mobile apps we track
-- ============================================================
create table if not exists public.cc_apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  play_package_name text unique,
  app_store_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists cc_apps_set_updated_at on public.cc_apps;
create trigger cc_apps_set_updated_at
  before update on public.cc_apps
  for each row execute procedure moddatetime(updated_at);

-- ============================================================
-- cc_store_kind: enum-as-text for portability
-- ============================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'cc_store_kind') then
    create type cc_store_kind as enum ('play', 'app_store');
  end if;
end $$;

-- ============================================================
-- cc_app_metrics_daily: snapshot of public store metrics per day
-- ============================================================
create table if not exists public.cc_app_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.cc_apps(id) on delete cascade,
  store cc_store_kind not null,
  date date not null,
  average_rating numeric(3, 2),
  ratings_count integer,
  reviews_count integer,
  downloads bigint,
  version text,
  created_at timestamptz not null default now(),
  unique (app_id, store, date)
);

create index if not exists cc_app_metrics_daily_app_store_date_idx
  on public.cc_app_metrics_daily (app_id, store, date desc);

-- ============================================================
-- cc_app_versions: released versions per store (for review correlation)
-- ============================================================
create table if not exists public.cc_app_versions (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.cc_apps(id) on delete cascade,
  store cc_store_kind not null,
  version text not null,
  released_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (app_id, store, version)
);

create index if not exists cc_app_versions_app_store_idx
  on public.cc_app_versions (app_id, store, released_at desc);

-- ============================================================
-- cc_reviews: raw user reviews ingested from the providers
-- external_id is provider-specific; uniqueness is per (app, store)
-- ============================================================
create table if not exists public.cc_reviews (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.cc_apps(id) on delete cascade,
  store cc_store_kind not null,
  external_id text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  author text,
  lang text,
  version text,
  created_at_store timestamptz not null,
  fetched_at timestamptz not null default now(),
  unique (app_id, store, external_id)
);

create index if not exists cc_reviews_app_store_created_idx
  on public.cc_reviews (app_id, store, created_at_store desc);
create index if not exists cc_reviews_rating_idx on public.cc_reviews (rating);

-- ============================================================
-- cc_review_sentiment: AI-generated sentiment + topics, 1:1 with reviews
-- Only created if the review has been analyzed (idempotent)
-- ============================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'cc_review_sentiment') then
    create type cc_review_sentiment as enum ('pos', 'neu', 'neg');
  end if;
end $$;

create table if not exists public.cc_review_analyses (
  review_id uuid primary key references public.cc_reviews(id) on delete cascade,
  sentiment cc_review_sentiment not null,
  topics text[] not null default '{}',
  summary text,
  model text not null,
  metadata jsonb not null default '{}'::jsonb,
  analyzed_at timestamptz not null default now()
);

create index if not exists cc_review_analyses_sentiment_idx
  on public.cc_review_analyses (sentiment);
create index if not exists cc_review_analyses_topics_gin_idx
  on public.cc_review_analyses using gin (topics);

-- ============================================================
-- cc_review_suggested_replies: lazy on-demand suggestions
-- ============================================================
create table if not exists public.cc_review_suggested_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.cc_reviews(id) on delete cascade,
  suggestion text not null,
  model text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cc_review_suggested_replies_review_idx
  on public.cc_review_suggested_replies (review_id, created_at desc);

-- ============================================================
-- cc_executive_summaries: weekly/monthly LLM digests per app
-- ============================================================
create table if not exists public.cc_executive_summaries (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.cc_apps(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  highlights jsonb not null,
  model text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (app_id, period_start, period_end)
);

create index if not exists cc_executive_summaries_app_period_idx
  on public.cc_executive_summaries (app_id, period_end desc);

-- ============================================================
-- cc_app_sync_state: throttle + cursor per (app, store)
-- ============================================================
create table if not exists public.cc_app_sync_state (
  app_id uuid not null references public.cc_apps(id) on delete cascade,
  store cc_store_kind not null,
  last_synced_at timestamptz,
  last_review_external_id text,
  last_error text,
  primary key (app_id, store)
);

-- ============================================================
-- RLS: read open to authenticated; writes only via service role
-- (sync-service uses admin client which bypasses RLS)
-- ============================================================
alter table public.cc_apps                       enable row level security;
alter table public.cc_app_metrics_daily          enable row level security;
alter table public.cc_app_versions               enable row level security;
alter table public.cc_reviews                    enable row level security;
alter table public.cc_review_analyses            enable row level security;
alter table public.cc_review_suggested_replies   enable row level security;
alter table public.cc_executive_summaries        enable row level security;
alter table public.cc_app_sync_state             enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'cc_apps', 'cc_app_metrics_daily', 'cc_app_versions', 'cc_reviews',
    'cc_review_analyses', 'cc_review_suggested_replies',
    'cc_executive_summaries', 'cc_app_sync_state'
  ]) loop
    execute format(
      'drop policy if exists "%1$s_read_authenticated" on public.%1$s',
      t
    );
    execute format(
      'create policy "%1$s_read_authenticated" on public.%1$s ' ||
      'for select using (auth.role() = ''authenticated'')',
      t
    );
  end loop;
end $$;
