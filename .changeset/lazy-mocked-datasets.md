---
"@anticapture/dashboard": patch
---

Cut 12.7k lines of mocked chart datasets out of the client bundle: delete the unreferenced token-distribution dataset and load the attack-profitability dataset dynamically, only when the research-pending blur is active. Replace the wildcard `next/image` `remotePatterns` with an explicit host allowlist and drop the deprecated `domains` key. Avatars whose host is user- or provider-controlled — the OAuth account button, ENS avatars in tables and drawers, and the ENS avatar in the wallet-connect chip — now render `unoptimized`, so they keep loading under the narrower allowlist.
