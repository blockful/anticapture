---
name: local-dev
description: Use when setting up, running, or troubleshooting the local development environment. Covers the full-stack dev script, individual service startup, port assignments, startup order, and common issues.
---

# Local Development Guide

## Use This Skill When

- You need to run the full local stack or a subset of services.
- You are debugging service startup, port conflicts, or readiness issues.
- You need to understand the startup order and service dependencies.
- A user asks "how do I run this locally?" or needs help with `pnpm dev`.

## Prerequisites

### Railway CLI Login (one-time setup)

The local dev environment connects to the **Railway cluster** for databases, RPCs, and shared services. You must authenticate once before running any services:

```bash
railway login
```

This is a one-time step -- once authenticated, the session persists across restarts.

### Important: Real Data

Local services are **pointed at real Railway databases and infrastructure**. This means:

- You are reading/writing to **staging databases**.
- Changes made through the local API or indexer **affect real data**.
- Treat local development with the same care as a deployed environment.

## Quick Start

```bash
# Full stack without a local API (uses remote/Railway API endpoints)
pnpm dev

# Full stack with a local API for a specific DAO
pnpm dev <dao_id>
# Example: pnpm dev ens
```

## Services & Ports

| Service       | Command              | Port  | Description                             |
| ------------- | -------------------- | ----- | --------------------------------------- |
| **API**       | `pnpm api dev <dao>` | 42069 | REST API (only when dao_id is provided) |
| **Gateway**   | `pnpm gateway dev`   | 4000  | GraphQL Mesh aggregating DAO APIs       |
| **Gateful**   | `pnpm gateful dev`   | 5000  | REST gateway wrapping the GraphQL layer |
| **Client**    | `pnpm client dev`    | --    | GraphQL codegen + build watch (no port) |
| **Dashboard** | `pnpm dashboard dev` | 3000  | Next.js frontend                        |

## Startup Order & Dependencies

The services must start in this exact order because each depends on the previous one being ready:

```
1. API (optional)       -- listens on :42069
       |
2. Gateway              -- needs API URLs via DAO_API_* env vars; listens on :4000
       |
3. Gateful              -- needs Gateway; listens on :5000
       |
4. Client (codegen)     -- needs Gateway schema to generate types
       |
5. Dashboard            -- needs generated client types; listens on :3000
```

### How `pnpm dev` orchestrates this

1. If a `dao_id` argument is provided, starts the API and waits for port 42069 to be listening. Sets `DAO_API_<DAO_UPPER>=http://localhost:42069` so the Gateway discovers it.
2. Starts the Gateway and waits for the log line `"Mesh running at"` to confirm readiness.
3. Starts Gateful and waits for the log line `"REST Gateway running"` to confirm readiness.
4. Starts Client in errors-only mode (suppresses output unless error/fail is detected).
5. Starts the Dashboard.
6. On `Ctrl+C`, sends TERM to all child processes and cleans up temp files.

## Running Individual Services

When you only need a subset (common during development):

### UI-only work (dashboard changes)

Point the client and dashboard at the deployed dev Gateway -- no need to run API/Gateway locally:

```bash
pnpm client dev       # codegen against remote gateway
pnpm dashboard dev    # start frontend
```

### API feature work

```bash
pnpm api dev <dao_id>         # start local API
pnpm gateway dev              # start gateway (picks up local API via env)
# Only add client + dashboard if you need to verify the UI
```

### Gateway/Gateful work

```bash
pnpm gateway dev
pnpm gateful dev
```

## Environment Variables

- `DAO_API_<DAO_UPPER>`: Tells the Gateway where each DAO's API lives. When running a local API, `pnpm dev` sets this automatically (e.g., `DAO_API_ENS=http://localhost:42069`). For remote APIs, these come from `.env` files.

## Troubleshooting

| Problem                                | Likely Cause                             | Fix                                                              |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Gateway fails to start                 | Missing `DAO_API_*` env vars             | Ensure at least one DAO API URL is set in env or run with dao_id |
| Port already in use                    | Another process on 42069/4000/5000/3000  | `lsof -i :<port>` to find and kill the process                   |
| Client codegen errors                  | Gateway not ready or schema changed      | Ensure Gateway is running and healthy before starting client     |
| Dashboard type errors after API change | Stale generated types                    | Re-run `pnpm client dev` or `pnpm client codegen`                |
| Timeout waiting for service            | Service crashed silently or slow startup | Check service logs directly: `pnpm <service> dev`                |

## pnpm Shortcuts Reference

These are defined in the root `package.json` and map to workspace filters:

```bash
pnpm api <cmd>       # --filter=@anticapture/api
pnpm gateway <cmd>   # --filter=@anticapture/api-gateway
pnpm gateful <cmd>   # --filter=@anticapture/gateful
pnpm client <cmd>    # --filter=@anticapture/graphql-client
pnpm dashboard <cmd> # --filter=@anticapture/dashboard (with dotenv)
pnpm indexer <cmd>   # --filter=@anticapture/indexer
```
