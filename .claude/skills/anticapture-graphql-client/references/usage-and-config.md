# Usage and Configuration

## Usage in Dashboard

### Import Generated Code

```typescript
import { useGetDaoQuery, Dao } from "@anticapture/graphql-client";

export function DaoComponent() {
  const { data, loading, error } = useGetDaoQuery({
    context: { headers: {"anticapture-dao-id": "ens"} },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const dao: Dao | undefined = data?.dao;

  return <div>{dao?.name}</div>;
}
```

For hooks-only imports, use:

```typescript
import { useGetDaoQuery } from "@anticapture/graphql-client/hooks";
```

## Environment Variables

Preferred local setup is `packages/graphql-client/.env` (copy from `.env.example`).
`codegen.ts` also supports falling back to `../../apps/api-gateway/schema.graphql` when no endpoint env var is set.

| Variable                       | Required | Description                     |
| ------------------------------ | -------- | ------------------------------- |
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | yes      | API Gateway URL (with /graphql) |

## Codegen Commands

- `pnpm run --filter=@anticapture/graphql-client codegen`
- `pnpm run --filter=@anticapture/graphql-client codegen:watch`
