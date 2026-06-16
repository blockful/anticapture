---
"@anticapture/client": patch
---

Re-run client codegen whenever `apps/api` or `apps/gateful` change. Because the SDK is generated from the live Gateful spec URL (not a package dependency), Turbo had no file edge to the contract sources and would serve a stale cached SDK after a gateway/API change. Added `$TURBO_ROOT$/apps/api/**` and `$TURBO_ROOT$/apps/gateful/**` to the codegen task inputs so contract changes invalidate the cache.
