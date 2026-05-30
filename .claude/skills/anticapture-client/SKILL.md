---
name: anticapture-client
description: Use for packages/anticapture-client work: Kubb REST SDK codegen from the Gateful OpenAPI spec, generated types/hooks/zod/MSW, exports, and schema-sync issues.
---

# REST Client Package Guide

## Use This Skill When

- You are editing `packages/anticapture-client` (`@anticapture/client`).
- The Gateful OpenAPI spec changed and the SDK needs regeneration.
- Generated files are stale or type/hook imports break in the dashboard.
- You are adjusting Kubb config, the custom Ethereum format generators, or package exports.

## Package Snapshot

- Location: `packages/anticapture-client` (published as `@anticapture/client`)
- Stack: [Kubb](https://kubb.dev) — generates a typed SDK from an OpenAPI spec
- Input: `apps/gateful/openapi/gateful.json` (the Gateful REST OpenAPI document)
- Config: `kubb.config.ts`
- Outputs (`./generated`, bundled to `dist/` by `tsup`):
  - models/types (`pluginTs`)
  - vanilla fetch client functions (`pluginClient`)
  - React Query hooks (`pluginReactQuery`)
  - Zod schemas (`pluginZod`), MSW handlers (`pluginMsw`), Faker mocks (`pluginFaker`)
  - MCP tool definitions (`pluginMcp`) — see `mcp-server.ts`
- Custom generators in `src/generators` map Ethereum formats (addresses, bigint) to proper TS types and fakers.

## Exports

- `@anticapture/client` — vanilla fetch functions + generated types (use in Server Components, scripts, sitemap, SEO).
- `@anticapture/client/hooks` — React Query hooks (use in client components).

## How It Works

1. **Spec input**: Reads the Gateful OpenAPI JSON (`apps/gateful/openapi/gateful.json`).
2. **Type generation**: Emits TypeScript models for every schema, with Ethereum-aware format mapping.
3. **Client generation**: Emits a `fetch`-based function per operation.
4. **Hook generation**: Emits a React Query hook per operation (`useXxx`).
5. **Export**: Functions/types from the root entry, hooks from the `/hooks` subpath.

> The DAO is a **path parameter** (first argument), typed as a string-enum key
> (e.g. `CompareActiveSupplyPathParamsDaoEnumKey`). Pass `daoId.toLowerCase()`
> cast to that type — there is no `anticapture-dao-id` header anymore.

## When to Regenerate

Run codegen when:

1. The Gateful OpenAPI spec (`apps/gateful/openapi/gateful.json`) changes.
2. `kubb.config.ts` or the custom generators change.
3. After pulling generated/spec-related changes.

Commands:

- `pnpm client codegen` (`kubb --config kubb.config.ts`)
- Watch: `pnpm client dev` (`kubb generate --watch`)
- Build the publishable SDK: `pnpm client build` (`tsup`)

## Important Rules

- **DO NOT** manually edit files under `generated/`.
- **DO** commit generated files to version control.
- **DO** use generated types instead of `any`.
- Keep the Gateful spec the single source of truth — regenerate rather than hand-patching types.

For usage patterns and env setup see `./references/usage-and-config.md`.
