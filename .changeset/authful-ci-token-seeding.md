---
"@anticapture/authful": minor
---

On Railway PR previews (`RAILWAY_ENVIRONMENT_NAME` other than `dev`/`production`) the service now seeds a fixed token from the required `SEED_TOKEN_PLAINTEXT` env var on boot — idempotently, so it survives restarts — giving the rest of the preview stack a known key to authenticate with. The seeding capability is internal only; the admin API still mints exclusively with server-generated values.
