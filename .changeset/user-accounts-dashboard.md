---
"@anticapture/dashboard": minor
---

Add platform sign-in (accounts) to the dashboard. A sign-in modal offers
wallet (SIWE) authentication against the new User API through a same-origin
`/api/user` proxy, mounted app-wide. Draft proposals move onto the session-
scoped User API: identity comes from the session (no caller-supplied address),
shared-draft ownership is derived server-side, and saving prompts sign-in when
there is no session. The modal also offers email (magic link) and Google
sign-in, each shown only where enabled (NEXT_PUBLIC_EMAIL_LOGIN /
NEXT_PUBLIC_GOOGLE_LOGIN); whitelabel is wallet-only.
