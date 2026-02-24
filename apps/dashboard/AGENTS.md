# Dashboard Package Guide

## Overview

- **Port**: 3000
- **Stack**: Next.js 16, React 19, Tailwind CSS 4, Apollo Client 3, React Query 5, wagmi 2, viem 2, Recharts 2
- **Purpose**: DAO governance analytics, risk assessment, and community tools
- **DAOs**: Uniswap, ENS, Optimism, Nouns, Compound, Gitcoin, Obol, Scroll

## Commands

```bash
pnpm dashboard dev          # Start dev server on :3000
pnpm dashboard typecheck    # Type checking
pnpm dashboard lint         # Lint checking
pnpm dashboard lint:fix     # Auto-fix lint issues
pnpm dashboard test         # Run Jest unit tests
pnpm dashboard build        # Production build
```

**Always run after changes**: `pnpm dashboard typecheck && pnpm dashboard lint && pnpm dashboard test`

## Environment Variables (`apps/dashboard/.env`)

| Variable                                | Required | Description                  |
| --------------------------------------- | -------- | ---------------------------- |
| `NEXT_PUBLIC_BASE_URL`                  | yes      | API Gateway GraphQL endpoint |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | yes      | WalletConnect project ID     |
| `NEXT_PUBLIC_ALCHEMY_KEY`               | yes      | Alchemy RPC key              |
| `NEXT_PUBLIC_SITE_URL`                  | no       | Site URL for SEO/meta        |
| `RESEND_API_KEY`                        | no       | Resend email API key         |
| `RESEND_FROM_EMAIL`                     | no       | Sender email address         |
| `CONTACT_EMAIL`                         | no       | Recipient for contact form   |

---

## Architecture

### Principles

1. **Server-First**: Components are Server Components by default. Add `"use client"` only at interaction boundaries.
2. **Features are self-contained**: Each feature owns its components, hooks, utils, and types.
3. **No cross-feature imports**: Features must never import from other features. Move shared code to `shared/`.
4. **Thin pages, rich features**: Pages compose features; features own business logic.

### Folder Structure

```
apps/dashboard/
├── app/                        # Next.js App Router (routing + composition only)
│   ├── (landing)/              # Public pages
│   ├── [daoId]/
│   │   ├── (shell)/             # Main DAO pages (sidebar layout)
│   │   │   ├── attack-profitability/
│   │   │   ├── holders-and-delegates/
│   │   │   ├── resilience-stages/
│   │   │   ├── risk-analysis/
│   │   │   └── token-distribution/
│   │   └── (nested)/governance/
│   └── api/
├── features/                   # Domain modules (business logic)
│   └── <feature-name>/
│       ├── components/
│       ├── hooks/
│       ├── types.ts
│       └── utils/
├── shared/                     # Cross-cutting concerns
│   ├── components/
│   │   ├── design-system/
│   │   ├── layout/
│   │   ├── charts/
│   │   └── icons/
│   ├── hooks/
│   ├── dao-config/
│   ├── types/
│   ├── constants/
│   ├── providers/
│   └── utils/
├── widgets/
└── public/
```

### Where to Put New Code

| What you're adding                   | Where it goes                      |
| ------------------------------------ | ---------------------------------- |
| New dashboard feature                | `features/<feature-name>/`         |
| Feature-specific component/hook/util | `features/<feature>/...`           |
| Reusable UI component                | `shared/components/`               |
| Design system component              | `shared/components/design-system/` |
| Layout component                     | `shared/components/layout/`        |
| Shared hook or utility               | `shared/hooks/` or `shared/utils/` |
| Shared types                         | `shared/types/`                    |
| Next.js route                        | `app/`                             |

---

## Code Conventions

### Functions & Components

Always use arrow functions. **Exception**: Next.js page/layout/loading files use `export default function`.

```tsx
// Correct
export const DaoOverviewSection = ({ daoId }: Props) => <div>...</div>;

// App Router pages only
export default async function DaoOverviewPage({ params }: Props) { ... }
```

### Exports

Always use named exports. Never use default exports (except App Router pages/layouts).

### Type Imports

Always use `import type` for type-only imports. Use inline `type` for mixed imports.

```tsx
import type { DaoIdEnum } from "@/shared/types/daos";

// Mixed import with inline type
import {
  useGetProposalsQuery,
  type GetProposalsQuery,
} from "@anticapture/graphql-client/hooks";
```

### Props & Types Typing

Never use `React.FC` — it implicitly adds `children` to props and is redundant since TypeScript infers the return type from arrow functions.

Use `type` for component props. Inline for 1–2 props, named alias for 3+.

```tsx
type MetricCardProps = {
  title: string;
  value: string | null;
  changeRate: string | null;
  icon?: React.ReactNode;
};

export const MetricCard = ({ title, value, changeRate, icon }: MetricCardProps) => { ... };
```

Use `interface` for hook params and hook return types — these benefit from `extends` when building on generated types:

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

**Rule of thumb**: `type` for component props and local shapes; `interface` when you need to extend an existing type (especially generated types).

### Hooks

Feature hooks that use Apollo or React Query require `"use client"` at the top of the file. Always return objects, never tuples. Name booleans with `is`/`has` prefixes.

```tsx
"use client";

export const useTokenHolders = (daoId: DaoIdEnum) => {
  return { data, isLoading, error, hasNextPage, refetch };
};
```

### Import Ordering

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

### No Barrel Files

Always import directly from the source file. Never import from `index.ts`. Barrel files force bundlers to load all re-exported modules even when only one is needed, create circular dependency risks, and make it harder to trace where code lives.

```tsx
// Correct
import { MetricCard } from "@/shared/components/cards/MetricCard";

// Wrong
import { MetricCard } from "@/shared/components";
```

### Import Boundaries

```
features/X → @/shared/*       ✅ allowed
features/X → features/X/*     ✅ allowed (internal)
features/X → features/Y/*     ❌ forbidden — move to shared/
```

### Naming

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

### Other Rules

- **Strings**: Always double quotes. Template literals only for interpolation.
- **Async**: Always use async arrow functions.
- **Errors**: Use try/catch for async operations. Log with `console.error`. Never silently swallow errors.
- **Conditionals**: Ternary for either/or, `&&` for show/hide, early return for guards. No nested ternaries.
- **Immutability**: Never mutate props, state, or objects from hooks. Always create new references with spread or `.map()`. React relies on reference identity to detect changes — mutations cause stale renders.
- **No `forwardRef`**: React 19 supports `ref` as a regular prop. Declare `ref?: React.Ref<Element>` in the props type instead of wrapping with `forwardRef`.
- **Comments**: JSDoc for exported functions/hooks. No commented-out code. No obvious comments — only explain _why_, never _what_.

```tsx
// Wrong: states the obvious
// Set loading to true
setIsLoading(true);

// Correct: explains non-obvious reasoning
// Clamp to 0–100 to prevent chart overflow on stale data
const normalized = Math.min(100, Math.max(0, percentage));
```

### File Structure Within a Component File

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

---

## Single Responsibility

Each file should do one thing. If a file is growing hard to describe in a single sentence, split it.

**Components**: one visual concern per component. A card that fetches its own data, formats it, and renders a chart is three responsibilities — split into a container, a hook, and a presentational component.

**Hooks**: one data concern per hook. Don't combine unrelated queries or side effects in a single hook because they happen to be used in the same component.

```tsx
// Wrong: hook doing too much
export const useDaoPage = (daoId: string) => {
  const proposals = useGetProposalsFromDaoQuery(...);
  const holders = useGetHoldersQuery(...);
  const githubRelease = useGitHubRelease();
  const { address } = useAccount();
  // ...
};

// Correct: each hook owns one concern
export const useProposals = (daoId: string) => { ... };
export const useHolders = (daoId: string) => { ... };
export const useGitHubRelease = () => { ... };
```

**Utilities**: one transformation per function. Composing utilities is better than a multi-purpose function with flags.

```tsx
// Wrong
export const formatValue = (value: number, type: "currency" | "percent" | "address") => { ... };

// Correct
export const formatCurrency = (value: number) => { ... };
export const formatPercent = (value: number) => { ... };
export const formatAddress = (address: string) => { ... };
```

---

## Server vs Client Components

Add `"use client"` only when the component uses: `useState`, `useEffect`, `useRef`, event handlers, browser APIs, Recharts, wagmi, RainbowKit, nuqs, React Query, or Apollo hooks.

Push `"use client"` as deep as possible — sections/layouts stay Server Components; only interactive leaves are Client Components.

```
Page (Server)
└── Feature Section (Server)
    ├── Static layout, headings, cards
    └── Client Islands ("use client")
        ├── Interactive charts (Recharts)
        ├── Tables with pagination/sorting
        ├── Forms, wallet connection, URL state
```

---

## Hook Structure

For hooks that do more than a single query, separate **data fetching** from **data transformation**. The query hook stays thin; a `useMemo` or a util handles the shape the component needs.

```tsx
// useProposals.ts — fetches only
export const useProposals = (daoId: DaoIdEnum) => {
  const { data, loading, error } = useGetProposalsFromDaoQuery({
    variables: { daoId },
    context: { headers: { "anticapture-dao-id": daoId } },
  });
  return {
    rawProposals: data?.proposals?.items ?? [],
    isLoading: loading,
    error,
  };
};

// useProposalMetrics.ts — transforms only
export const useProposalMetrics = (daoId: DaoIdEnum) => {
  const { rawProposals, isLoading, error } = useProposals(daoId);
  const metrics = useMemo(
    () => computeProposalMetrics(rawProposals),
    [rawProposals],
  );
  return { metrics, isLoading, error };
};
```

When transformation logic is non-trivial, extract it to a pure util in `utils/` and test it there — not inside the hook.

## Loading, Skeleton & Error States

Every component that fetches data must handle all three states explicitly. Never render partial UI silently.

```tsx
export const ProposalList = ({ daoId }: { daoId: DaoIdEnum }) => {
  const { proposals, isLoading, error } = useProposals(daoId);

  if (isLoading) return <ProposalListSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (!proposals.length) return <EmptyState />;

  return (
    <ul>
      {proposals.map((p) => (
        <ProposalRow key={p.id} proposal={p} />
      ))}
    </ul>
  );
};
```

Rules:

- **Skeleton** mirrors the shape of the real UI — same height, columns, and layout. Never use a generic spinner unless inside a full-page `Suspense` boundary.
- **Error state** shows a message. Never show a blank or broken layout.
- **Empty state** is distinct from loading. Always render something intentional when data is empty.
- For Server Components, use Next.js `loading.tsx` for route-level skeletons and `<Suspense>` for section-level streaming.

---

## Component Composition

Prefer `children` and simple props over render props or slots. Reach for more complex patterns only when the simpler one breaks. Let parents decide what to render — inject content via `children` or `ReactNode` props instead of hardcoding child components inside a container.

**`children`** — for layout wrappers and containers where the parent doesn't need to know about the content:

```tsx
export const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "border-border-default bg-surface-default rounded-lg border p-5",
      className,
    )}
  >
    {children}
  </div>
);
```

**Named slots via props** — when the parent needs to compose multiple distinct regions:

```tsx
type ChartCardProps = {
  header: React.ReactNode;
  chart: React.ReactNode;
  footer?: React.ReactNode;
};

export const ChartCard = ({ header, chart, footer }: ChartCardProps) => (
  <div className="flex flex-col gap-4">
    <div>{header}</div>
    <div>{chart}</div>
    {footer && <div>{footer}</div>}
  </div>
);
```

**Avoid render props** — they add complexity without benefit in a codebase using hooks. If you feel you need a render prop, the logic probably belongs in a hook instead.

Do not over-abstract. A component used in one place does not need to be made composable. Generalize only when there is a second real use case.

---

## Props Design

Design props for the consumer, not for the implementation.

### Prefer `ReactNode` for visual content

When a prop controls what users **see**, type it as `ReactNode`. This lets consumers extend the component without modifying it.

```tsx
// ❌ Closed: every visual variation requires a new prop
type CardHeaderProps = {
  title: string;
  titleBold?: boolean;
  titleIcon?: IconName;
};

// ✅ Open: consumers control rendering freely
type CardHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
};
```

Use primitive types (`string`, `number`) only when the component **processes** the value — formats it, sorts by it, uses it as a key, or derives a filename.

### Accept only what you use

Don't pass entire objects when the component only reads a few fields. This reduces coupling and makes the component easier to test and reuse.

```tsx
// ❌ Receives entire config, only uses 2 fields
export const DaoHeader = ({ daoConfig }: { daoConfig: DaoConfiguration }) => (
  <>
    <h1>{daoConfig.name}</h1>
    {daoConfig.forumLink && <a href={daoConfig.forumLink}>Forum</a>}
  </>
);

// ✅ Depends only on what it renders
export const DaoHeader = ({
  name,
  forumLink,
}: {
  name: string;
  forumLink?: string;
}) => (
  <>
    <h1>{name}</h1>
    {forumLink && <a href={forumLink}>Forum</a>}
  </>
);
```

When a component genuinely needs many fields from the same source, use `Pick` instead of the full object:

```tsx
type DaoHeaderProps = Pick<DaoConfiguration, "name" | "color" | "forumLink">;
```

### Discriminated unions over boolean flags

When states are mutually exclusive, model them as a union. Never use multiple booleans that create impossible combinations.

```tsx
// ❌ isRequired and isOptional can both be true
type FormLabelProps = {
  isRequired?: boolean;
  isOptional?: boolean;
};

// ✅ One state at a time
type FormLabelProps = {
  modifier?: "required" | "optional";
};
```

```tsx
// ❌ Two booleans encoding three states
type DividerProps = {
  isVertical?: boolean;
  isHorizontal?: boolean;
};

// ✅ Single prop with default
type DividerProps = {
  orientation?: "vertical" | "horizontal"; // default: "horizontal"
};
```

For simpler cases (two truly independent booleans), booleans are fine. Use unions when three or more states compete or when booleans are mutually exclusive.

### Extend native elements correctly

When wrapping a native HTML element, accept and forward all remaining props so it works as a drop-in replacement. In React 19, `ref` is a regular prop — do not use `forwardRef`.

```tsx
type ButtonProps = {
  variant?: "primary" | "secondary";
  ref?: React.Ref<HTMLButtonElement>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  variant = "primary",
  className,
  children,
  ref,
  ...rest
}: ButtonProps) => (
  <button
    ref={ref}
    className={cn(VARIANT_STYLES[variant], className)}
    {...rest}
  >
    {children}
  </button>
);
```

Always destructure your custom props and spread `...rest` onto the native element. This ensures new native attributes (e.g., `aria-label`, `data-testid`) work without modification.

---

## Styling: Tailwind vs Custom CSS

Default to Tailwind utilities. Write custom CSS only when Tailwind genuinely cannot express it.

| Situation                              | Approach                                               |
| -------------------------------------- | ------------------------------------------------------ |
| Layout, spacing, color, typography     | Tailwind utilities                                     |
| Dynamic value from data                | `style` prop (e.g. `style={{ width: \`${pct}%\` }}`)   |
| Complex animation or pseudo-element    | Custom CSS in `globals.css` or CSS module              |
| Tailwind utility with runtime variable | CSS custom property + Tailwind (e.g. `[--offset:8px]`) |

Never write custom CSS for something Tailwind can do. Never use arbitrary Tailwind values (`w-[372px]`) for spacing or sizing that belongs in the design token scale — if the value isn't in the scale, check with design before adding it.

Class organization inside `cn()`:

```tsx
className={cn(
  "flex flex-col gap-4 p-5",                          // layout + spacing
  "w-full max-w-screen-2xl",                           // sizing
  "bg-surface-default border-border-default",          // colors
  "text-sm font-medium",                               // typography
  { "opacity-50 pointer-events-none": isDisabled },   // conditional states
  className,                                           // allow external override last
)}
```

---

## Data Fetching

| Context                        | Tool                                          |
| ------------------------------ | --------------------------------------------- |
| GraphQL queries                | Apollo Client (`@anticapture/graphql-client`) |
| Non-GraphQL (GitHub, external) | React Query (`@tanstack/react-query`)         |
| Form submissions               | React Query `useMutation`                     |
| URL-derived state              | `nuqs` (`useQueryState`)                      |
| Ephemeral UI state             | `useState`                                    |

```tsx
// Apollo (GraphQL) — always pass anticapture-dao-id header for DAO-scoped queries
export const useProposals = (daoId: DaoIdEnum) => {
  const { data, loading, error } = useGetProposalsFromDaoQuery({
    variables: { limit: 10, orderDirection: "desc" },
    context: { headers: { "anticapture-dao-id": daoId } },
  });
  return { proposals: data?.proposals?.items ?? [], isLoading: loading, error };
};

// React Query (non-GraphQL)
export const useGitHubRelease = () => {
  return useQuery({
    queryKey: ["github-release"],
    queryFn: async () => {
      const res = await fetch("https://api.github.com/repos/...");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });
};
```

---

## State Management

| State Type                | Solution                 | Example                          |
| ------------------------- | ------------------------ | -------------------------------- |
| URL/shareable state       | `nuqs` (`useQueryState`) | Filters, active tabs, pagination |
| Server data (GraphQL)     | Apollo Client cache      | DAO metrics, proposals, votes    |
| Server data (non-GraphQL) | React Query cache        | GitHub releases, ENS data        |
| Form state                | `react-hook-form`        | Contact form, voting modal       |
| Ephemeral UI              | `useState`               | Modal open/close, hover states   |
| Cross-component UI        | React Context (scoped)   | Chart brush selection            |

---

## Bundle Size

- **No barrel files**: Import directly from source files
- **Direct icon imports**: `import { CircleSlash } from "lucide-react"` — never import the full library
- **`next/dynamic`**: Lazy-load charts and heavy components
- **`optimizePackageImports`** in `next.config.ts` for third-party libraries that only offer barrel imports

---

## Testing

- **Hooks**: `renderHook()` from `@testing-library/react`
- **Components**: Integration tests with data passed as props
- **E2E**: Playwright for critical flows (DAO overview, governance)

```tsx
import { render, screen } from "@testing-library/react";
import { MetricCard } from "@/shared/components/cards/MetricCard";

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(
      <MetricCard title="Active Supply" value="1,000,000" changeRate="+5%" />,
    );
    expect(screen.getByText("Active Supply")).toBeInTheDocument();
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
  });

  it("handles null value gracefully", () => {
    render(<MetricCard title="Active Supply" value={null} changeRate={null} />);
    expect(screen.getByText("Active Supply")).toBeInTheDocument();
  });
});
```
