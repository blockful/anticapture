# Usage and Configuration

## Usage in Dashboard

### React Query hook (client components)

Hooks live on the `/hooks` subpath. The DAO is the first (path) argument.

```typescript
import { useCompareActiveSupply } from "@anticapture/client/hooks";
import type { CompareActiveSupplyPathParamsDaoEnumKey } from "@anticapture/client";

export const useCostOfAttack = (daoId: DaoIdEnum) => {
  const activeSupply = useCompareActiveSupply(
    daoId.toLowerCase() as CompareActiveSupplyPathParamsDaoEnumKey,
    { days: 90 },
  );

  return { activeSupply: activeSupply.data?.activeSupply };
};
```

### Vanilla fetch (Server Components, sitemap, SEO, scripts)

Plain async functions are exported from the package root — no hooks, no React.

```typescript
import { offchainProposals } from "@anticapture/client";

const response = await offchainProposals("ens", { limit: 10 });
const proposals = response.data;
```

### Default headers

Use `setClientConfig` at app startup to attach headers (e.g. an API key or
`x-client-source` identifier) to every request:

```typescript
import { setClientConfig } from "@anticapture/client";
```

## Environment Variables

The SDK targets the Gateful REST API. The base URL is configured by the
consumer (the dashboard sets `NEXT_PUBLIC_GATEFUL_URL`). Codegen itself reads
the **local** OpenAPI spec file, so it needs no endpoint env var.

| Variable                  | Required        | Description                                        |
| ------------------------- | --------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_GATEFUL_URL` | yes (dashboard) | Gateful REST API base URL the SDK calls at runtime |

## Codegen Commands

- `pnpm client codegen` — generate the SDK from `apps/gateful/openapi/gateful.json`
- `pnpm client dev` — watch mode (regenerate on spec change)
- `pnpm client build` — bundle the publishable package with `tsup`
