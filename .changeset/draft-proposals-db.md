---
"@anticapture/api": minor
"@anticapture/dashboard": minor
"@anticapture/gateful": patch
---

feat(draft-proposals): persist draft proposals in PostgreSQL with SIWE authentication

Moves draft proposal storage from browser localStorage to the API's PostgreSQL database. Adds SIWE-based JWT authentication endpoints (`GET /auth/nonce`, `POST /auth/verify`) and full CRUD endpoints for draft proposals (`/proposal/drafts`). On wallet connect, existing localStorage drafts are automatically migrated to the database. Drafts are scoped per user address and DAO.
