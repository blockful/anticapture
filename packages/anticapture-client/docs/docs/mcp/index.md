---
id: index
title: MCP server
sidebar_label: MCP
sidebar_position: 4
hide_table_of_contents: true
---

# MCP server

Anticapture ships a hosted [Model Context Protocol](https://modelcontextprotocol.io)
server so agentic clients (Claude Desktop, Claude Code, Cursor, deployed
assistants) can query DAO governance analytics in natural language.

## Connecting

Add the server to your MCP client configuration (the bearer token is the same
API key used for the [REST API](../getting-started.md#authentication)):

```json
{
  "mcpServers": {
    "anticapture": {
      "type": "http",
      "url": "https://mcp.anticapture.com/mcp",
      "headers": {
        "Authorization": "Bearer <your-anticapture-token>"
      }
    }
  }
}
```

This connects to the public MCP HTTP transport instance.

## How tools map to the API

The MCP tools are generated from the same OpenAPI spec as the
[API Reference](/api-reference/anticapture-rest-api):

- **Tool name** = the operation's `operationId` (e.g. the `proposals` tool
  calls `GET /{dao}/proposals`).
- **Tool group** = the operation's tag (e.g. `governance`, `treasury`,
  `voting-power`).
- **Tool inputs** = the operation's path, query, and body parameters; the
  `dao` path parameter becomes a required tool argument.

Every tool's parameters, defaults, and response shape are documented on the
corresponding endpoint page in the API Reference. Relayer endpoints are not
exposed through the MCP.

## Example session

Once connected, describe what you want in plain language:

```
❯ Query the most recent UNI proposals with anticapture

⏺ I'll query the most recent UNI proposals.

  Called anticapture proposals tool

⏺ Here are the 5 most recent UNI (Uniswap) proposals (97 total on-chain):

  #97 Return 12.5M Delegated Tokens to the Governance Timelock - EXECUTED
  #96 Protocol Fee Expansion: Vote 3 - EXECUTED
  #95 Protocol Fee Expansion: Vote 2 - EXECUTED
  #94 Protocol Fee Expansion: Vote 1 - EXECUTED
  #93 UNIfication - EXECUTED

  All five passed comfortably (quorum is 40M UNI) and have been executed.
```
