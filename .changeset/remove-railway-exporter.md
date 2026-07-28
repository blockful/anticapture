---
---

Remove the `railway-exporter` monitoring service. It never emitted a single
`railway_service_*` sample in either environment — its account-level
`RAILWAY_API_KEY` was rejected for the whole retained history — so its only
effect was a permanently firing `RailwayExporterStale` critical alert and three
blank Grafana panels. Drops the scrape job, the three Railway alert rules, the
three dashboard panels, and the Dockerfile/railway.toml pair. Railway's own
dashboard still shows per-service CPU/RAM/egress; only alerting on them is gone.
