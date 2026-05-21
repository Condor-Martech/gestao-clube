# Stores Intelligence

Provider-based ingestion of public store data (Google Play + Apple App Store) for the Gerenciamento Clube Condor dashboard.

## Module map

```
lib/stores/
├── types.ts                          # Shared types (ReviewRecord, MetricsRecord, DeviceType, errors)
├── repository.ts                     # Supabase IO (reads + delegates aggregations)
├── metrics-aggregations.ts           # Pure functions: by-country, by-device, daily aggregates
├── sync-service.ts                   # Orchestrates fetch → upsert with throttle + sync-state
└── providers/
    ├── index.ts                      # getProvider() factory
    ├── app-store.ts                  # App Store Connect provider
    ├── play-store.ts                 # Play Store orchestrator (Promise.allSettled of 3 paths)
    ├── play-store-auth.ts            # Multi-scope GoogleAuth (cached)
    ├── play-store-reviews.ts         # androidpublisher API — reviews
    └── play-store-reporting.ts       # playdeveloperreporting API — installs + ratings
```

## Setup — Play Store path

The Play Store provider uses **two Google APIs** with one service account:

| API                                     | Used for                                                | Required         |
| --------------------------------------- | ------------------------------------------------------- | ---------------- |
| `androidpublisher.googleapis.com`       | Reviews                                                 | Always           |
| `playdeveloperreporting.googleapis.com` | Installs, uninstalls, ratings, country/device breakdown | For metrics tabs |

### Step 1 — GCP project setup

1. Open [console.cloud.google.com](https://console.cloud.google.com)
2. Select (or create) the GCP project that owns the service account
3. Enable both APIs:
   - **APIs & Services → Library → Google Play Android Developer API → Enable**
   - **APIs & Services → Library → Google Play Developer Reporting API → Enable**

### Step 2 — Service Account

If you don't already have one:

1. **IAM & Admin → Service Accounts → Create**
2. Name: `clube-condor-stores-sync` (or similar)
3. **Done** — no GCP roles needed (permissions live in Play Console, not IAM)
4. Click the SA → **Keys → Add Key → Create new key → JSON → Create**
5. Save the downloaded JSON — this is your `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

⚠️ **You only get the JSON once.** If you lose it, generate a new key.

### Step 3 — Play Console invitation

1. [play.google.com/console](https://play.google.com/console) → **Users and permissions → Invite new users**
2. **Email**: paste the SA's `client_email` (the `...iam.gserviceaccount.com` value from the JSON)
3. **App permissions** for Clube Condor:
   - ✅ **View app information (read-only)** — required for installs/ratings
   - ✅ **View financial data, orders, and cancellation survey responses** — also required for ratings (despite the name; non-financial data is included)
4. **Invite user**
5. Wait ~5–10 min for permissions to propagate

You do **NOT** need a Google Payments Merchant Account — Play Developer Reporting API is exempt.

### Step 4 — Environment variables

In `apps/web/.env.local`:

```bash
# JSON content (single line, single quotes)
# Tip: jq -c . path/to/sa.json | pbcopy
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}'

# Throttle minutes between syncs per (app, store). Default: 60.
STORES_SYNC_THROTTLE_MINUTES=60
```

**Validation:**

```bash
node -e "JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON); console.log('OK')"
```

## Setup — App Store path

(Existing — see `providers/app-store.ts`. Requires `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_PRIVATE_KEY`.)

## Architecture

### Provider Compose pattern

`PlayStoreProvider.fetch()` runs three independent paths concurrently and merges results with `Promise.allSettled`:

```
              ┌─ androidpublisher → fetchPlayReviews() ──→ ReviewRecord[]
              │
fetch()  ─────┼─ playdeveloperreporting → fetchInstallCounts() ──→ MetricsRecord[]
              │
              └─ playdeveloperreporting → fetchRatings() ──→ MetricsRecord[]
```

**Failure semantics:**

- All 3 succeed → full result
- Some fail → partial result returned (failed paths empty), `console.warn` logged
- All 3 fail → throw consolidated error

The sync-service persists what it gets and writes the error to `cc_app_sync_state.last_error` for UI surfacing.

### Aggregation split

Pure aggregation logic lives in `metrics-aggregations.ts`, separate from `repository.ts`. Repository fetches rows; aggregators reduce them. This makes aggregators trivially unit-testable without DB mocks.

```
repository.fetchMetricsInWindow() ──→ aggregator(rows) ──→ list*() output
```

### Database schema

Table: `cc_app_metrics_daily`

| Column                                                                     | Type              | Notes                                                                             |
| -------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| `id`, `app_id`, `store`, `date`                                            | base columns      | —                                                                                 |
| `average_rating`, `ratings_count`, `reviews_count`, `downloads`, `version` | legacy columns    | preserved for back-compat                                                         |
| `country_code`                                                             | text, nullable    | ISO 3166-1 alpha-2; NULL = aggregate / not applicable                             |
| `device_type`                                                              | text, nullable    | PHONE/TABLET/TV/WEAR/OTHER; NULL = aggregate / not applicable (e.g. ratings rows) |
| `installs`, `uninstalls`                                                   | integer, nullable | from `playdeveloperreporting`                                                     |

Uniqueness: `UNIQUE NULLS NOT DISTINCT (app_id, store, date, country_code, device_type)` — Postgres 15+ feature so NULLs in the constraint are treated as equal (one canonical aggregate row per date).

### Tabs UX

`/stores` is a hub with shared layout + sub-routes. Each tab is its own URL (bookmarkeable):

| URL                  | Tab         | Component                                   |
| -------------------- | ----------- | ------------------------------------------- |
| `/stores`            | Visão geral | KPIs + ratings/volume charts                |
| `/stores/reviews`    | Avaliações  | Stub (TBD)                                  |
| `/stores/audiencia`  | Audiência   | Top countries table + device donut          |
| `/stores/tendencias` | Tendências  | Installs vs uninstalls + rating correlation |

The tabs nav is a custom Client Component (`_components/tabs-nav.tsx`) using `<Link>` + `usePathname` — NOT Radix `Tabs`, because we want URL-based navigation, not in-page state.

## Manual verification plan

Run after configuring env vars + applying migrations.

### 1. Sync smoke test

```bash
npm run dev
# In browser: open /stores → triggers syncIfStale in background (after())
# Wait ~30s, refresh
```

Then check Postgres directly:

```sql
-- Should have rows with country_code + device_type set
select country_code, device_type, count(*), sum(installs)
from cc_app_metrics_daily
where app_id = '<your-app-id>' and store = 'play'
group by 1, 2
order by 1, 2 nulls first;

-- Last sync state
select * from cc_app_sync_state where app_id = '<your-app-id>' and store = 'play';
```

If `last_error` is null and rows exist → sync working.

### 2. UI tabs walkthrough

| Action                                         | Expected                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Open `/stores`                                 | Tabs nav visible with "Visão geral" active                                                               |
| Click Audiência                                | URL becomes `/stores/audiencia`, period selector visible, tabs nav stays, "Visão geral" no longer active |
| Change period 30d → 7d                         | URL gets `?period=7d`, data refetches                                                                    |
| Click Tendências                               | Charts render, axes correct (rating 0-5 left, installs auto right)                                       |
| Refresh page on `/stores/audiencia?period=90d` | URL preserved, data persists                                                                             |
| (No data scenario)                             | Empty state cards in Audiência/Tendências, "Em breve" in Reviews                                         |

### 3. Error states

To test `MISSING_PLAY_PERMISSIONS`:

- Temporarily remove the SA from Play Console → next sync writes the error to `cc_app_sync_state.last_error`
- UI: status list under header shows the error string

To test `RATE_LIMITED`:

- Hard to trigger naturally (200 calls/day is generous). Skip unless adding observability.

## Tests

### Unit + integration (Vitest)

```bash
npm test                                       # all
npx vitest run play-store                      # all play-related
npx vitest run play-store-auth                 # 5 tests
npx vitest run play-store-reviews              # 4 tests
npx vitest run play-store-reporting            # 13 tests
npx vitest run play-store.test                 # 5 orchestrator tests
npx vitest run metrics-aggregations            # 13 tests
```

**Total: 40 tests** for the Play Store path.

### E2E (Playwright)

⚠️ Playwright is installed but **not configured** at the time of this change. To enable:

1. Run `npx playwright init` to scaffold `playwright.config.ts`
2. Configure auth fixtures (Supabase test user)
3. Add seed data fixtures
4. Write specs in `tests/e2e/`

Coverage suggested when added:

- Tabs navigation + active state derivation from URL
- Empty states (no metrics seeded)
- With seed data: top countries renders, donut renders, charts render
- Error banner when `last_error` set in sync-state

## Extension points — adding a new metric or dimension

1. **Type**: extend `MetricsRecord` in `types.ts` with the new field (nullable).
2. **Schema**: write a Supabase migration in `supabase/migrations/` adding the column.
3. **Provider**: in `play-store-reporting.ts`, add a new endpoint or extend an existing parser.
4. **Repository**: extend `fetchMetricsInWindow` select clause + add a new `aggregate*` helper if needed.
5. **UI**: build a chart/component and wire it from a tab page.
6. **Tests**: parser test + aggregator test (both pure-function, fast).

## Glossary

| Term              | Meaning                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Reviews**       | User-submitted text + rating per individual review (`androidpublisher`)                   |
| **Ratings**       | Aggregate `averageRating` + `ratingsCount` per day per country (`playdeveloperreporting`) |
| **Installs**      | Active device installs counted on the dimension breakdown (`playdeveloperreporting`)      |
| **Aggregate row** | Row with `country_code IS NULL AND device_type IS NULL` — global daily total              |
