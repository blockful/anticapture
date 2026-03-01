---
name: anticapture-graphql-client
description: Used whenever working with the GraphQL Client package (codegen, types, hooks) or running the gateway locally
---

# GraphQL Client Package Guide

## Overview

- **Stack**: @graphql-codegen/cli, @graphql-codegen/typescript-react-apollo
- **Purpose**: Auto-generated TypeScript types and React Apollo hooks from the API Gateway's GraphQL schema

## What It Does

- Fetches GraphQL schema from API Gateway
- Generates TypeScript type definitions for all GraphQL types
- Creates React hooks for queries
- Provides type-safe GraphQL client for the Dashboard

## Dependencies

- **API Gateway**: URL on `ANTICAPTURE_GRAPHQL_ENDPOINT`, either local or on the cloud.

## File Structure

```
packages/graphql-client/
├── src/
│   ├── generated/              # Auto-generated files (DO NOT EDIT)
│   │   ├── graphql.ts          # TypeScript types
│   │   └── operations.ts       # React hooks
│   └── index.ts                # Package exports
├── codegen.ts                  # GraphQL Codegen configuration
└── package.json
```

## How It Works

1. **Schema introspection**: Fetches schema from API Gateway endpoint
2. **Type generation**: Creates TypeScript types for all GraphQL types
3. **Hook generation**: Creates React Apollo hooks for operations
4. **Export**: Makes types and hooks available via package imports

## When to Regenerate

Run `pnpm client codegen` when:

1. GraphQL schema changes in the API Gateway
2. After pulling changes that include schema updates

## Important Rules

- **DO NOT** manually edit files in `src/generated/`
- **DO** commit generated files to version control
- **DO** use generated types instead of `any`

For usage examples and codegen configuration see `./references/usage-and-config.md`.
