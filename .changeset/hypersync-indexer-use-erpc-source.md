---
"@anticapture/hypersync-indexer": patch
---

Switch the mainnet chain's data source from the public HyperSync endpoint
(`https://eth.hypersync.xyz`) to the internal eRPC gateway
(`http://erpc.railway.internal:5000/indexer/evm/1`). The chain block now
uses HyperIndex V3's `rpc.url` field instead of `hypersync_config.url`,
routing all indexing traffic through Railway-hosted eRPC for caching,
rate-limit pooling, and provider failover.
