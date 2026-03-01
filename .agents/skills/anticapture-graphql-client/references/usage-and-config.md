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

## Environment Variables

Configure in `packages/graphql-client/.env`:

| Variable                       | Required | Description                     |
| ------------------------------ | -------- | ------------------------------- |
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | yes      | API Gateway URL (with /graphql) |
