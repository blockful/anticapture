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
      "url": "https://api.anticapture.com/mcp",
      "headers": {
        "Authorization": "Bearer <ANTICAPTURE_MCP_API_KEY>"
      }
    }
  }
}
```

This will connect to the public MCP HTTP transport instance.

## Querying the protocol

Once you've got your client connection set up, querying the Anticapture MCP is as simple as describing the request in plain natural language (ex.: Claude Code):

```
❯ Query the most recent UNI proposals with anticapture

⏺ I'll query the most recent UNI proposals. Let me load the relevant tool schema first.

  Called anticapture (ctrl+o to expand)

⏺ Here are the 5 most recent UNI (Uniswap) proposals (97 total on-chain):

  ┌─────┬──────────────────────────────────────────────────────────┬─────────────┬───────────────────────────────┬────────────┐
  │  #  │                          Title                           │   Status    │ For / Against / Abstain (UNI) │  Executed  │
  ├─────┼──────────────────────────────────────────────────────────┼─────────────┼───────────────────────────────┼────────────┤
  │ 97  │ Return 12.5M Delegated Tokens to the Governance Timelock │ ✅ EXECUTED │ 45.2M / ~0.06 / 4.77M         │ 2026-06-01 │
  ├─────┼──────────────────────────────────────────────────────────┼─────────────┼───────────────────────────────┼────────────┤
  │ 96  │ Protocol Fee Expansion: Vote 3                           │ ✅ EXECUTED │ 72.98M / 0 / ~112             │ 2026-05-31 │
  ├─────┼──────────────────────────────────────────────────────────┼─────────────┼───────────────────────────────┼────────────┤
  │ 95  │ Protocol Fee Expansion: Vote 2                           │ ✅ EXECUTED │ 77.83M / ~11 / 0              │ 2026-03-07 │
  ├─────┼──────────────────────────────────────────────────────────┼─────────────┼───────────────────────────────┼────────────┤
  │ 94  │ Protocol Fee Expansion: Vote 1                           │ ✅ EXECUTED │ 62.84M / ~4,968 / 0           │ 2026-03-04 │
  ├─────┼──────────────────────────────────────────────────────────┼─────────────┼───────────────────────────────┼────────────┤
  │ 93  │ UNIfication                                              │ ✅ EXECUTED │ 125.34M / ~742 / 1.5M         │ 2025-12-27 │
  └─────┴──────────────────────────────────────────────────────────┴─────────────┴───────────────────────────────┴────────────┘

  Notes:
  - All five passed comfortably (quorum is 40M UNI) and have been executed.
  - Vote totals are shown in whole UNI (raw values are in 18-decimal wei).
  - The recent activity centers on the Protocol Fee Expansion series (votes 1–3) and the UNIfication proposal.

  Want me to pull the full details (description + execution payload) for any specific one, or fetch the next page of older proposals?

✻ Churned for 14s
```
