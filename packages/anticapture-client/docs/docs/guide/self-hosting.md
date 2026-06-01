---
id: self-hosting
title: Self-hosting & local development
sidebar_position: 2
---

# Self-hosting & local development

This page is for people who want to run the server **themselves**:
contributors hacking on the tools, anyone who wants to keep their queries on
their own infrastructure, or developers who want the whole stack on `localhost`.
If that is not you, you can safely skip it.

## Prerequisites

The MCP server lives in the `@anticapture/client` package inside the
[Anticapture monorepo](https://github.com/blockful-io/anticapture). Clone it,
then from the repo root:

```sh
pnpm install
pnpm client codegen   # generates the MCP tool handlers from the OpenAPI spec
```

`codegen` is required before the first run — the tool surface in
`packages/anticapture-client/generated/` is generated, not committed.

## Running the server

There are two ways to run it locally. They expose the **same** generated tools;
they differ only in how your client talks to the process.

### As a subprocess (stdio)

The simplest option for local development. Your MCP client spawns the server as
a child process and talks to it over stdio — nothing binds to a port, nothing
needs auth. This is what Claude Desktop and most local agents use.

```sh
pnpm mcp
```

### As a local HTTP service (Streamable HTTP)

Runs the server as a long-lived HTTP process — the same transport as the
deployed image. Use this when you want to mirror production locally, or reach
the server from another machine on your network.

```sh
pnpm mcp-http
```

It binds to `HOST:PORT` (default `0.0.0.0:3100`) and, unless you disable it,
expects a bearer token on every request (see below).

## Configuration

The server is configured entirely through environment variables:

| Variable                  | Purpose                                                                        | Default                 |
| ------------------------- | ------------------------------------------------------------------------------ | ----------------------- |
| `ANTICAPTURE_API_URL`     | Upstream Anticapture API base URL the server queries                           | `http://localhost:4001` |
| `ANTICAPTURE_API_KEY`     | Bearer token this server sends to the **upstream** API                         | —                       |
| `ANTICAPTURE_MCP_API_KEY` | Bearer token required from **inbound** MCP HTTP clients (omit to disable auth) | —                       |
| `PORT` / `HOST`           | HTTP server bind (HTTP transport only)                                         | `3100` / `0.0.0.0`      |

There are two independent bearer layers, and it helps to keep them straight:

- **Inbound** — what an MCP HTTP client must present to _this_ server
  (`ANTICAPTURE_MCP_API_KEY`). Only relevant to the HTTP transport. Omit it to
  turn inbound auth off entirely.
- **Upstream** — what _this_ server presents to the Anticapture API it queries
  (`ANTICAPTURE_API_KEY`). Needed when you point at the hosted API; **not**
  needed when you run the API yourself (see next section).

## Running with no API key at all

You can run the entire thing without any token — the catch is that you take on
running the upstream API too. The keys only exist because the **hosted** API is
gated; a copy you run yourself is not.

To go fully keyless:

1. Run the upstream stack locally so there is an API to talk to — the indexer
   (to populate the database), then the API, then the gateway. See the
   monorepo's local-development guide for the exact startup order.
2. Point the MCP server at your local API: `ANTICAPTURE_API_URL=http://localhost:4001`
   (the default), and leave `ANTICAPTURE_API_KEY` **unset** — your own API does
   not require one.
3. Leave `ANTICAPTURE_MCP_API_KEY` **unset** to disable inbound auth.

The trade-off is real: you are now responsible for indexing and serving the data
yourself, which is far more setup than using the hosted server. It is worth it
only if you specifically need everything to stay local.

## Wiring into Claude Desktop

For the stdio transport, `mcp-server.sh` is a thin launcher that `cd`s into the
package directory and runs the server with the bundled `tsx`. Claude Desktop
spawns it from an arbitrary working directory, so point it at the script with an
absolute path:

```json
{
  "mcpServers": {
    "anticapture": {
      "type": "stdio",
      "command": "sh",
      "args": [
        "/absolute/path/to/anticapture/packages/anticapture-client/mcp-server.sh"
      ]
    }
  }
}
```

Make sure you have run `pnpm install` and `pnpm client codegen` once before
launching, so that `tsx` and `generated/` are present.

## Developing the tools

If you are changing what the tools _do_, you need to know that the tool surface
is **generated**, not hand-authored — Kubb produces it from the OpenAPI spec:

```
apps/api/openapi/**                  (per-DAO REST contracts)
        │
apps/gateful/openapi/gateful.json    ← single source of truth
        │
        ├─► Kubb pluginMcp     → generated/mcp/**            (MCP tools)
        ├─► Kubb pluginClient   → SDK + React Query hooks
        └─► this docs site (OpenAPI plugin)                  (Tools reference)
```

So the rules are:

- **Never hand-edit** `generated/mcp/**` — it is overwritten on every `codegen`.
- Change a tool's **name** → change the operation's `operationId`.
- Change a tool's **description** (what the agent reads when picking it) →
  change the operation's `summary` / `description`.
- Change a tool's **inputs** → change the operation's parameters / request body.
- After any spec change, run `pnpm client codegen` to regenerate the tools, and
  rebuild this site (`pnpm client-docs build`) to regenerate the Tools
  reference.

Because both the tools and the **Tools** section of this site are projections of
the same `gateful.json`, their signatures cannot drift apart — only this
hand-written guide can age.
