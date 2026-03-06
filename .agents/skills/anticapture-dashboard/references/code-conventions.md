# Dashboard Code Conventions

## Functions And Components

Always use arrow functions. **Exception**: Next.js page/layout/loading files use `export default function`.

```tsx
// Correct
export const DaoOverviewSection = ({ daoId }: Props) => <div>...</div>;

// App Router pages only
export default async function DaoOverviewPage({ params }: Props) {
  ...
}
```

## Exports

Always use named exports. Never use default exports (except App Router pages/layouts).

## Type Imports

Always use `import type` for type-only imports. Use inline `type` for mixed imports.

```tsx
import type { DaoIdEnum } from "@/shared/types/daos";

// Mixed import with inline type
import {
  useGetProposalsQuery,
  type GetProposalsQuery,
} from "@anticapture/graphql-client/hooks";
```

## Props And Types Typing

Never use `React.FC`; it implicitly adds `children` to props and is redundant since TypeScript infers the return type from arrow functions.

Use `type` for component props. Inline for 1 to 2 props, named alias for 3 or more.

```tsx
type MetricCardProps = {
  title: string;
  value: string | null;
  changeRate: string | null;
  icon?: React.ReactNode;
};

export const MetricCard = ({
  title,
  value,
  changeRate,
  icon,
}: MetricCardProps) => {
  ...
};
```

Use `interface` for hook params and hook return types; these benefit from `extends` when building on generated types:

```tsx
import type { GetProposalsActivityQueryVariables } from "@anticapture/graphql-client";

interface UseProposalsActivityParams extends GetProposalsActivityQueryVariables {
  limit: number;
  daoId: DaoIdEnum;
}

interface UseProposalsActivityResult {
  data: ProposalActivityData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

Rule of thumb: `type` for component props and local shapes; `interface` when extending an existing type (especially generated types).

## Hooks

Feature hooks that use Apollo or React Query require `"use client"` at the top of the file. Always return objects, never tuples. Name booleans with `is`/`has` prefixes.

```tsx
"use client";

export const useTokenHolders = (daoId: DaoIdEnum) => {
  return { data, isLoading, error, hasNextPage, refetch };
};
```

## Import Ordering

```tsx
// 1. React
import { useState, useMemo } from "react";
// 2. External libraries
import { Crosshair2Icon } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
// 3. Type imports (external)
import type { Metadata } from "next";
// 4. Shared modules
import { cn } from "@/shared/utils/cn";
import { MetricCard } from "@/shared/components/cards/MetricCard";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
// 5. Feature imports
import { MultilineChartAttackProfitability } from "@/features/attack-profitability/components/MultilineChartAttackProfitability";
// 6. Local/relative
import { OverviewMetric } from "./components/OverviewMetric";
import type { OverviewData } from "./types";
```

## No Barrel Files

Always import directly from the source file. Never import from `index.ts`. Barrel files force bundlers to load all re-exported modules even when only one is needed, create circular dependency risks, and make it harder to trace where code lives.

```tsx
// Correct
import { MetricCard } from "@/shared/components/cards/MetricCard";

// Wrong
import { MetricCard } from "@/shared/components";
```

## Import Boundaries

```text
features/X -> @/shared/*       allowed
features/X -> features/X/*     allowed (internal)
features/X -> features/Y/*     forbidden, move to shared/
```

## Naming

| Entity            | Convention         | Example                                  |
| ----------------- | ------------------ | ---------------------------------------- |
| Folders           | kebab-case         | `attack-profitability/`                  |
| Component files   | PascalCase         | `MetricCard.tsx`                         |
| Hook files        | camelCase with use | `useTokenHolders.ts`                     |
| Utility files     | camelCase          | `formatAddress.ts`                       |
| Types             | PascalCase         | `type MetricCardProps`                   |
| Constants         | UPPER_SNAKE_CASE   | `const METRICS_SCHEMA`                   |
| Functions         | camelCase          | `formatVariation()`                      |
| Boolean variables | is/has/should      | `isLoading`, `hasNextPage`               |
| Event handlers    | handle prefix      | `handleSubmit`, `handleCopy`             |
| Path aliases      | `@/*`              | `import { cn } from "@/shared/utils/cn"` |

## Other Rules

- **Strings**: Always double quotes. Template literals only for interpolation.
- **Async**: Always use async arrow functions.
- **Errors**: Use try/catch for async operations. Log with `console.error`. Never silently swallow errors.
- **Conditionals**: Ternary for either/or, `&&` for show/hide, early return for guards. No nested ternaries.
- **Immutability**: Never mutate props, state, or objects from hooks. Always create new references with spread or `.map()`.
- **No `forwardRef`**: React 19 supports `ref` as a regular prop. Declare `ref?: React.Ref<Element>` in props instead of `forwardRef`.
- **Comments**: JSDoc for exported functions/hooks. No commented-out code. No obvious comments; explain why, not what.

```tsx
// Wrong: states the obvious
// Set loading to true
setIsLoading(true);

// Correct: explains non-obvious reasoning
// Clamp to 0-100 to prevent chart overflow on stale data
const normalized = Math.min(100, Math.max(0, percentage));
```

## File Structure Within A Component File

```tsx
"use client"; // 1. Directive (only if needed)

// 2. Imports (ordered per import rules above)
import { useState } from "react";
import { cn } from "@/shared/utils/cn";
import type { DaoIdEnum } from "@/shared/types/daos";

// 3. Constants (module-level)
const METRICS_SCHEMA = { ... } as const;

// 4. Types
type Props = { ... };

// 5. Main exported component
export const AttackProfitabilityChartCard = ({ daoId }: Props) => {
  // ...
};

// 6. Sub-components (private, not exported)
const CardHeader = ({ ... }: { ... }) => {
  // ...
};
```
