---
"@anticapture/dashboard": patch
---

Fix incorrect figures in the ENS revenue overview and renewal KPIs.

- `transformToOverview` no longer divides by zero when every revenue stream is empty for a period; the three stream shares now fall back to `0%` (text and `sharePercent`) instead of rendering `NaN%`/`Infinity` into the progress bars.
- The "New Wallets" KPI trend is now computed from the current-vs-previous month delta instead of being hard-coded to `"up"`, so the arrow reflects actual direction (and is omitted when there is no comparison month).
- `transformToRenewalCohorts` aggregates yearly renewal rate as `sum(renewedCount) / sum(termsExpiring)` (count-weighted) rather than averaging monthly `renewalRatePct` with equal weight, which previously misstated the "Renewal Rate by Expiry Year" chart when monthly term volumes diverged.
