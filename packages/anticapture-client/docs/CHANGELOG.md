# @anticapture/client-docs

## 0.1.0

### Minor Changes

- [#2077](https://github.com/blockful/anticapture/pull/2077) [`f9b8269`](https://github.com/blockful/anticapture/commit/f9b82690c09eb34b8652b50c591dea38a1dc51c9) Thanks [@pikonha](https://github.com/pikonha)! - specific domain for mcp and docs

### Patch Changes

- [#2074](https://github.com/blockful/anticapture/pull/2074) [`096b590`](https://github.com/blockful/anticapture/commit/096b59049579d65d781101210d1b44f6430e5fd9) Thanks [@brunod-e](https://github.com/brunod-e)! - Restructure the docs site as the full Anticapture API documentation: REST API reference generated from the Gateful OpenAPI spec (internal `skip-pagination` tag stripped, relayer endpoints still excluded), a dedicated MCP guide, and a new Webhooks section (hand-written HMAC verification guide + reference generated from the webhook service spec). Rebrand from "MCP Docs" to "Anticapture API Docs", redirect old `/tools/*` URLs to `/api-reference/*`, and retheme to the Anticapture dashboard identity (Inter + Roboto Mono, brand orange on zinc, dark by default).

## 0.0.1

### Patch Changes

- [#1960](https://github.com/blockful/anticapture/pull/1960) [`4264eba`](https://github.com/blockful/anticapture/commit/4264ebab4ec2faf1758e641cc67fbdb9549ff2bf) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Serve the docs site under the `/docs/` base path so it can be fronted by the shared Railway reverse proxy alongside the MCP server.
