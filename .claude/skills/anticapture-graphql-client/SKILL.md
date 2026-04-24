---
name: anticapture-graphql-client
description: Use for packages/graphql-client work: GraphQL documents, codegen config, generated types/hooks, exports, and schema-sync issues.
---

# GraphQL Client Package Guide

## Use This Skill When

- You are editing `packages/graphql-client`.
- You added/changed `.graphql` documents used by dashboard.
- Generated files are stale or type imports break.
- Gateway schema changes require client regeneration.

## Package Snapshot

- Location: `packages/graphql-client`
- Stack: GraphQL Code Generator
- Inputs: `documents/**/*.graphql` + schema from `ANTICAPTURE_GRAPHQL_ENDPOINT` or `../../apps/api-gateway/schema.graphql`
- Outputs:
  - `generated.ts` (React Apollo hooks + operation types)
  - `types.ts` (types/operations without React hooks)
  - `hooks.ts` and `index.ts` (exports)

## How It Works

1. **Schema introspection**: Fetches schema from API Gateway endpoint
2. **Type generation**: Creates TypeScript types for all GraphQL types
3. **Hook generation**: Creates React Apollo hooks for operations
4. **Export**: Makes types and hooks available via package imports

## When to Regenerate

Run codegen when:

1. GraphQL schema changes in the API Gateway
2. `.graphql` operations in `documents/` change
3. After pulling generated/schema-related changes

Command:

- `pnpm run --filter=@anticapture/graphql-client codegen`
- Optional watch: `pnpm run --filter=@anticapture/graphql-client codegen:watch`

## Important Rules

- **DO NOT** manually edit generated sections in `generated.ts` and `types.ts`
- **DO** commit generated files to version control
- **DO** use generated types instead of `any`

For usage patterns and env setup see `./references/usage-and-config.md`.
