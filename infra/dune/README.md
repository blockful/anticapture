# Dune queries read by production

Every Dune query the Anticapture API reads lives in one Dune team and is read with one API key.

- **Dune team:** `ffquenomelv_team_d483ebd1` (login `shared@blockful.io`), Analyst plan, 4,000 credits per month.
- **API key:** `anticapture-revenue`, created in that team. It is the value of every Dune key variable below.
- **Engine:** Medium. The plan refuses Large.
- **Schedules:** set in the Dune UI (the API cannot create them). List:
  <https://dune.com/workspace/t/ffquenomelv_team_d483ebd1/schedules>

## Inventory

| Query                               | Dune ID | Schedule (UTC)       | Credits per run | Service       | Variable holding the ID or URL                 | SQL in this repo                                       |
| ----------------------------------- | ------- | -------------------- | --------------- | ------------- | ---------------------------------------------- | ------------------------------------------------------ |
| ENS revenue totals                  | 9152944 | Daily, 16:30–17:00   | 78              | `ens-api`     | `REVENUE_DUNE_REVENUE_TOTALS_QUERY_ID`         | `apps/api/src/services/revenue/sql/revenue_totals.sql` |
| ENS actions                         | 9152945 | Daily, 16:30–17:00   | 7               | `ens-api`     | `REVENUE_DUNE_ACTIONS_QUERY_ID`                | `apps/api/src/services/revenue/sql/actions.sql`        |
| ENS new registrants                 | 9152946 | Daily, 16:30–17:00   | < 1             | `ens-api`     | `REVENUE_DUNE_NEW_WALLETS_QUERY_ID`            | `apps/api/src/services/revenue/sql/new_wallets.sql`    |
| ENS active names                    | 9152947 | Daily, 16:30–17:00   | 2               | `ens-api`     | `REVENUE_DUNE_ACTIVE_NAMES_QUERY_ID`           | `apps/api/src/services/revenue/sql/active_names.sql`   |
| ENS renewal funnel                  | 9152948 | Daily, 16:30–17:00   | 1               | `ens-api`     | `REVENUE_DUNE_RENEWAL_FUNNEL_QUERY_ID`         | `apps/api/src/services/revenue/sql/renewal_funnel.sql` |
| ENS upcoming expirations            | 9152949 | Daily, 16:30–17:00   | < 1             | `ens-api`     | `REVENUE_DUNE_RENEWAL_TENURE_QUERY_ID`         | `apps/api/src/services/revenue/sql/renewal_tenure.sql` |
| ENSv2 daily (revenue and migration) | 9155159 | Daily                | 1               | `ens-api`     | `REVENUE_DUNE_ENSV2_DAILY_QUERY_ID` (optional) | `apps/api/src/services/revenue/sql/ensv2_daily.sql`    |
| ENS revenue by category             | 9154590 | Daily, 21:30–22:00   | < 1             | `ens-api`     | `REVENUE_DUNE_REVENUE_BY_CATEGORY_QUERY_ID`    | `infra/dune/ens_revenue_by_category.sql`               |
| Shutter liquid treasury             | 9154598 | Mondays, 21:30–22:00 | 78              | `shutter-api` | `TREASURY_DATA_PROVIDER_API_URL`               | `infra/dune/shutter_liquid_treasury.sql`               |

Key variables: `REVENUE_DUNE_API_KEY` on `ens-api`, `TREASURY_DATA_PROVIDER_API_KEY` on `shutter-api`.

Expected spend: about 2,700 credits per month for the daily ENS set and about 390 for the weekly Shutter run. Reading
results also costs credits; the API caches revenue results for 6 hours.

## Notes

- **ENS liquid treasury is not on Dune any more.** The old query (6535168) read Steakhouse's `query_2244104`, which
  stopped running on 2026-09-21 because a materialized view it depends on is gone or private. `ens-api` now uses
  `TREASURY_DATA_PROVIDER_ID=DEFILLAMA` with `https://api.llama.fi/treasury/ens`. On the last day both had data
  (2026-09-21) they differed by 0.5%: $118.82M on Dune, $118.20M on DefiLlama.
- **ENS revenue by category** is Steakhouse's accrual ledger, not the cash-basis definition of the other ENS revenue
  queries. The dashboard does not use `/revenue/by-category`. It was copied unchanged to keep the endpoint alive.
- **Shutter runs weekly** because one run costs as much as the largest ENS query. A daily schedule would take 60% of
  the monthly quota.
- The six ENS revenue files have been run on Dune since 2026-11-19 and matched their acceptance values. The note in
  `apps/api/src/services/revenue/sql/README.md` saying they were never run predates that.

## Retired

Queries in the personal context `@ffquenomelv`, no longer read by anything: 7531705, 7531711, 7531718, 7531722,
7531727, 7531730, 7531738 (ENS revenue), 6535168 (ENS treasury), 6841817 (Shutter treasury). The API key of that
context is no longer set on any service except as the unused `TREASURY_DATA_PROVIDER_API_KEY` on `ens-api`.

## Changing a query

1. Edit the SQL here and in the Dune query (same text), run it once, and compare with the previous result.
2. Keep the output columns: the API validates them (`apps/api/src/services/revenue/dune-client.ts`,
   `apps/api/src/services/treasury/providers/dune-provider.ts`).
3. A new query needs a schedule in the Dune UI and a row in the table above.
