---
"@anticapture/address-enrichment": minor
"@anticapture/client": minor
"@anticapture/dashboard": minor
---

Surface ENS social records and EFP stats for addresses.

- `address-enrichment` now reads the EFP `/details` endpoint, capturing the ENS `com.twitter`, `org.telegram`, `email`, and `com.github` text records plus EFP follower/following counts. These are exposed under `ens` (socials) and a new `efp` object, cached under the existing ENS TTL. EFP counts are returned even when the address has no primary ENS name.
- The Holders & Delegates drawer header now shows follower/following counts (linked to the EFP profile) and social links (X, Telegram, GitHub, email) for the selected address.
