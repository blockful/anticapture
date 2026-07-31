---
"@anticapture/offchain-indexer": patch
---

Keep paginating through same-second bursts when re-reading Snapshot proposals and votes: a page that lands entirely on one `created` second now advances with `skip` instead of stepping to the next second, which silently dropped every row past the first page — leaving revealed Shutter votes stuck with their encrypted choices.
