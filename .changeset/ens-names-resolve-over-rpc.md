---
"@anticapture/dashboard": patch
---

ENS names typed into the table address filters and the create-proposal custom action resolve again. The lookup used an ENSNode endpoint that now fails its TLS check, so every name came back unresolved; it now reads ENS on mainnet through the dashboard's RPC proxy in the browser, or eRPC on the server, and gives up after 5 seconds.
