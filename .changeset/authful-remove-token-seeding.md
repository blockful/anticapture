---
"@anticapture/authful": patch
---

Remove the manual `mint` CLI script and the existing-credential seeding path. Tokens are now minted exclusively via `POST /tokens` with server-generated values; the `plaintext` request field and the `TOKEN_PLAINTEXT` env var are gone.
