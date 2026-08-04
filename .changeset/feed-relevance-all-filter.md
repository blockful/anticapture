---
"@anticapture/api": minor
"@anticapture/gateful": minor
---

`GET /:dao/feed/events` accepts `relevance=ALL`, which drops the value threshold and returns every event instead of only those at or above a tier. The relevance tiers are cumulative value floors (LOW already includes MEDIUM and HIGH), so there was previously no way to ask for events below the LOW floor. Omitting the param still defaults to MEDIUM, so existing consumers are unaffected.
