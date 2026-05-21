---
"@anticapture/api": minor
"@anticapture/gateful": patch
"@anticapture/api-gateway": patch
"@anticapture/client": patch
"@anticapture/dashboard": patch
---

Add server-side `from` and `to` query parameters to `GET /accounts/{address}/balances/historical`. The dashboard's balance history now applies the buy/sell and custom address filters in the query (regenerated client surfaces them) so `totalCount`, pagination, and the first-page contents reflect the filtered set instead of being filtered after fetching. Fixes empty/incomplete filtered pages when matches live on later pages of the unfiltered dataset.
