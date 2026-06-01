---
id: getting-started
title: Getting started
sidebar_position: 1
---

# Getting started

## Connecting to the server

Anticapture offers MCP tooling for LLM consumption of the API resources; in order to connect to it, use the following configuration snippet (contact the Anticapture team for an API key):

```json
{
  "mcpServers": {
    "anticapture": {
      "type": "http",
      "url": "https://anticapture-mcp-server.up.railway.app/",
      "headers": {
        "Authorization": "Bearer <ANTICAPTURE_MCP_API_KEY>"
      }
    }
  }
}
```

This will connect to the public MCP HTTP transport instance; for development purposes or in order to run the server locally, head over to [self-hosting & local development](./self-hosting.md).

## Querying the protocol

Once you've got your client connection set up, querying the Anticapture MCP is as simple as describing the request in plain natural language (ex.: Claude Code):

```
❯ Fetch me the most recent proposals from ENS using anticapture

⏺ I'll load the anticapture proposals tool and fetch the most recent ENS
  proposals.

  Called anticapture (ctrl+o to expand)

⏺ Here are the 5 most recent ENS proposals (out of 69 total on-chain):

  EP: 6.41
  Title: [Executable] Endowment permissions to KPK — Update #9
  Status: ✅ EXECUTED
  For / Against / Abstain: 1,376,302 / 0 / 4,549
  Result: Expands endowment access to liquid staking/restaking (Stader,
    Ether.fi), Morpho USDT vaults, CoW Swap weETH/eETH routing
  ────────────────────────────────────────
  EP: 6.40
  Title: [Executable] Update DNSSEC Algorithm 7
  Status: ✅ EXECUTED
  For / Against / Abstain: 1,346,175 / 0 / ~0
  Result: Points DNSSEC algorithm 7 to the patched RSASHA1 contract (gap left by

    a prior security patch)
  ────────────────────────────────────────
  EP: 6.39
  Title: [Executable] Treasury Flow Automation
  Status: ✅ EXECUTED
  For / Against / Abstain: 1,306,368 / 45,226 / 6,536
  Result: Adds a Registrar Manager + Zodiac module so revenue flows
  automatically
    to the endowment (~$1M est. missed yield)
  ────────────────────────────────────────
  EP: 6.38
  Title: [Executable] Endowment permissions to karpatkey — Update #8
  Status: ✅ EXECUTED
  For / Against / Abstain: 1,217,997 / ~0 / 4,549
  Result: Routine ZRM update: GHO/FLUID CoW Swap perms, Fluid Merkle claims;
    removes SPK perms
  ────────────────────────────────────────
  EP: 6.37
  Title: [Executable] Transfer 900,000 USDC from Endowment to wallet.ensdao.eth
  Status: ✅ EXECUTED
  For / Against / Abstain: 1,338,773 / 0 / ~3.5
  Result: One-time USDC transfer to cover ENS Labs stream payments

  All five passed comfortably (quorum is 1M tokens) and have been executed
  on-chain. Vote figures are token-weighted, shown in whole tokens (raw values
  are 18-decimal wei).

  A few notes:
  - These are on-chain proposals. ENS also has off-chain (Snapshot) proposals —
  let me know if you want those too.
  - I requested the lean view (no calldata/targets). I can pull the full
  execution payload for any specific proposal, or fetch more than 5.

  Want me to dig into any one of these, or grab the next page?

✻ Brewed for 17s
```
