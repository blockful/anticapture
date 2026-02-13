# GraphQL Client Package Guide

## Overview

- **Package**: `@anticapture/graphql-client`
- **Location**: `packages/graphql-client`
- **Stack**: @graphql-codegen/cli 5.0, @graphql-codegen/typescript-react-apollo 4.3
- **Purpose**: Auto-generated TypeScript types and React Apollo hooks from the API Gateway's GraphQL schema

## What It Does

- Fetches GraphQL schema from API Gateway
- Generates TypeScript type definitions for all GraphQL types
- Creates React hooks for queries, mutations, and subscriptions
- Provides type-safe GraphQL client for the Dashboard
- Enables IDE autocomplete and compile-time type checking

## Commands

```bash
# Generate types and hooks (one-time)
pnpm client codegen

# Watch mode (auto-regenerate on schema changes)
pnpm client dev

# Verification
pnpm client typecheck          # Type checking
pnpm client lint                # Lint checking
```

## Dependencies

- **API Gateway**: Must be running (locally or on Railway)
- The gateway's GraphQL schema must be accessible

## Environment Variables

Configure in `packages/graphql-client/.env`:

| Variable                       | Required | Default | Description                     |
| ------------------------------ | -------- | ------- | ------------------------------- |
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | yes      | —       | API Gateway URL (with /graphql) |

### Example Configuration

```bash
# Local development (use remote gateway to avoid running full stack locally)
ANTICAPTURE_GRAPHQL_ENDPOINT=https://api-gateway-dev.railway.app/graphql

# Local gateway
ANTICAPTURE_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
```

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

## Generated Output

### TypeScript Types

```typescript
// src/generated/graphql.ts
export type Dao = {
  __typename?: "Dao";
  id: Scalars["ID"];
  name: Scalars["String"];
  tokenAddress: Scalars["String"];
  totalSupply: Scalars["BigInt"];
};

export type Query = {
  __typename?: "Query";
  dao: Dao;
  proposals: Array<Proposal>;
};
```

### React Hooks

```typescript
// src/generated/operations.ts
export function useGetDaoQuery(
  baseOptions?: Apollo.QueryHookOptions<GetDaoQuery, GetDaoQueryVariables>,
) {
  return Apollo.useQuery<GetDaoQuery, GetDaoQueryVariables>(
    GetDaoDocument,
    baseOptions,
  );
}
```

## Usage in Dashboard

### Import Generated Code

```typescript
// In dashboard components
import { useGetDaoQuery, Dao } from "@anticapture/graphql-client";

export function DaoComponent() {
  const { data, loading, error } = useGetDaoQuery({
    variables: { daoId: "ens" },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const dao: Dao | undefined = data?.dao;

  return <div>{dao?.name}</div>;
}
```

### Type Safety

```typescript
// Types are automatically inferred
const { data } = useGetDaoQuery();

// ✅ TypeScript knows this is Dao | undefined
const dao = data?.dao;

// ✅ Autocomplete available
const name = dao?.name;

// ❌ TypeScript error: Property 'invalid' does not exist
const invalid = dao?.invalid;
```

## Development Workflow

### When to Regenerate

Run `pnpm client codegen` when:

1. **GraphQL schema changes** in the API Gateway
2. **New queries/mutations** are added to the Dashboard
3. **GraphQL operations** are modified in the Dashboard
4. **After pulling changes** that include schema updates

### Typical Workflow

```bash
# 1. Ensure API Gateway is running
pnpm gateway dev

# 2. Generate types
pnpm client codegen

# 3. Use in Dashboard
pnpm dashboard dev

# 4. Make schema changes (in API or Gateway)
# ...edit code...

# 5. Regenerate
pnpm client codegen

# 6. Fix any type errors in Dashboard
pnpm dashboard typecheck
```

## Configuration

### GraphQL Codegen Config (`codegen.ts`)

```typescript
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: process.env.ANTICAPTURE_GRAPHQL_ENDPOINT,
  documents: ["../../apps/dashboard/**/*.{ts,tsx}"],
  generates: {
    "./src/generated/": {
      preset: "client",
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
      },
    },
  },
};

export default config;
```

## Common Issues

### Schema Fetch Fails

**Problem**: Cannot fetch schema from endpoint

**Solutions**:

- Check `ANTICAPTURE_GRAPHQL_ENDPOINT` is correct
- Ensure API Gateway is running and accessible
- Test endpoint manually: `curl <endpoint>`

### Type Mismatches

**Problem**: Types don't match API response

**Solutions**:

- Regenerate types: `pnpm client codegen`
- Check if API Gateway schema is up to date
- Clear Dashboard's Apollo cache

### Stale Types

**Problem**: Generated types are outdated

**Solutions**:

- Always regenerate after schema changes
- Use `pnpm client dev` in watch mode during development
- Add codegen to CI/CD pipeline

### Import Errors in Dashboard

**Problem**: Cannot import from `@anticapture/graphql-client`

**Solutions**:

- Run `pnpm install` in root to link workspace dependencies
- Check `package.json` has correct workspace reference
- Build the client package: `pnpm client build` (if applicable)

## Best Practices

### DO

- ✅ Use generated hooks in Dashboard components
- ✅ Regenerate after any schema changes
- ✅ Commit generated files to version control
- ✅ Use TypeScript types from generated code
- ✅ Point to remote gateway for local Dashboard development

### DON'T

- ❌ Manually edit files in `src/generated/`
- ❌ Skip regeneration after schema changes
- ❌ Ignore TypeScript errors after regeneration
- ❌ Use `any` types instead of generated types

## Integration with Dashboard

The Dashboard imports this package as a workspace dependency:

```json
// apps/dashboard/package.json
{
  "dependencies": {
    "@anticapture/graphql-client": "workspace:*"
  }
}
```

This ensures:

- Type safety across the frontend
- Single source of truth for GraphQL types
- Automatic updates when schema changes

## Related Documentation

- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [Apollo Client React Hooks](https://www.apollographql.com/docs/react/api/react/hooks)
- Root `AGENTS.md` for general guidelines
- `apps/api-gateway/AGENTS.md` for schema source
- `apps/dashboard/AGENTS.md` for usage examples
