---
"@anticapture/dashboard": minor
---

Add platform sign-in (accounts) to the dashboard. A sign-in modal offers
wallet (SIWE) authentication against the new User API through a same-origin
`/api/user` proxy, mounted app-wide. Draft proposals move onto the session-
scoped User API: identity comes from the session (no caller-supplied address),
shared-draft ownership is derived server-side, and saving prompts sign-in when
there is no session. Whitelabel is wallet-only; email and Google are shown per
design but disabled until their server plugins land.
