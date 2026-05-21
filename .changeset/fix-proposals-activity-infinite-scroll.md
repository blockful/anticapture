---
"@anticapture/dashboard": patch
---

Fix infinite scroll on the delegate proposals activity drawer. The summary fields (`totalProposals`, `votedProposals`, etc.) are only returned by the API on the first page, so the next-page check now anchors on the first page's total instead of the last page's (which was always 0 after the initial fetch).
