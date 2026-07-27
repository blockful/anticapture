---
"@anticapture/dashboard": minor
---

connecting a wallet no longer signs you in: delegating, voting and publishing a proposal open the wallet picker directly and ask for no SIWE signature, on both Anticapture and whitelabel. A connected wallet without a session is now a valid state (it used to be force-disconnected), and the header connect button opens the wallet picker instead of the login modal. The sign-in modal is still reached from the surfaces that need a server session, such as proposal drafts and API keys
