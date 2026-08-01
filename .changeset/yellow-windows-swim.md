---
---

Add a shared image for the DAO API databases that derives `max_connections` and
`effective_cache_size` from the container's cgroup memory limit at boot.
Infra-only — no workspace package changes.
