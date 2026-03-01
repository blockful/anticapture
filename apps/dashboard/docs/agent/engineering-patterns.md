# Dashboard Engineering Patterns

## Single Responsibility

Each file should do one thing. If a file is hard to describe in one sentence, split it.

**Components**: one visual concern per component. A card that fetches data, formats it, and renders a chart has three responsibilities; split into container, hook, and presentational component.

**Hooks**: one data concern per hook. Do not combine unrelated queries or side effects because they happen to be used in one component.

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
export const useProposals = (daoId: string) => {
  ...
};
export const useHolders = (daoId: string) => {
  ...
};
export const useGitHubRelease = () => {
  ...
};
```

**Utilities**: one transformation per function. Compose utilities rather than using a multi-purpose function with flags.

```tsx
// Wrong
export const formatValue = (
  value: number,
  type: "currency" | "percent" | "address",
) => {
  ...
};

// Correct
export const formatCurrency = (value: number) => {
  ...
};
export const formatPercent = (value: number) => {
  ...
};
export const formatAddress = (address: string) => {
  ...
};
```

## Server Vs Client Components

Add `"use client"` only when the component uses: `useState`, `useEffect`, `useRef`, event handlers, browser APIs, Recharts, wagmi, RainbowKit, nuqs, React Query, or Apollo hooks.

Push `"use client"` as deep as possible; sections/layouts stay Server Components and interactive leaves become Client Components.

```text
Page (Server)
└── Feature Section (Server)
    ├── Static layout, headings, cards
    └── Client Islands ("use client")
        ├── Interactive charts (Recharts)
        ├── Tables with pagination/sorting
        ├── Forms, wallet connection, URL state
```

## Hook Structure

For hooks doing more than one query, separate data fetching from data transformation. Keep the query hook thin; use `useMemo` or a util for derived shape.

```tsx
// useProposals.ts - fetches only
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

// useProposalMetrics.ts - transforms only
export const useProposalMetrics = (daoId: DaoIdEnum) => {
  const { rawProposals, isLoading, error } = useProposals(daoId);
  const metrics = useMemo(
    () => computeProposalMetrics(rawProposals),
    [rawProposals],
  );
  return { metrics, isLoading, error };
};
```

When transformation logic is non-trivial, extract it to a pure util in `utils/` and test it there, not inside the hook.

## Loading, Skeleton, And Error States

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

- **Skeleton** mirrors the real UI shape; avoid generic spinners unless inside full-page `Suspense`.
- **Error state** shows a message; never show a blank/broken layout.
- **Empty state** is distinct from loading.
- For Server Components, use `loading.tsx` for route-level skeletons and `<Suspense>` for section-level streaming.

## Component Composition

Prefer `children` and simple props over render props or slots. Let parents decide what to render using `children` or `ReactNode` props instead of hardcoding content in containers.

**`children`** for layout wrappers where parent does not need content awareness:

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

**Named slots via props** when parent composes multiple distinct regions:

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

Avoid render props in this codebase unless simpler composition fails. Do not over-abstract; generalize when there is a second real use case.

## Props Design

Design props for consumers, not implementation details.

### Prefer `ReactNode` For Visual Content

When a prop controls what users see, type it as `ReactNode`.

```tsx
// Closed: every visual variation requires a new prop
type CardHeaderProps = {
  title: string;
  titleBold?: boolean;
  titleIcon?: IconName;
};

// Open: consumers control rendering freely
type CardHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
};
```

Use primitive types (`string`, `number`) when the component processes the value.

### Accept Only What You Use

Do not pass full objects when only a few fields are required.

```tsx
// Receives entire config, only uses 2 fields
export const DaoHeader = ({ daoConfig }: { daoConfig: DaoConfiguration }) => (
  <>
    <h1>{daoConfig.name}</h1>
    {daoConfig.forumLink && <a href={daoConfig.forumLink}>Forum</a>}
  </>
);

// Depends only on what it renders
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

When many fields from the same source are truly needed, use `Pick`:

```tsx
type DaoHeaderProps = Pick<DaoConfiguration, "name" | "color" | "forumLink">;
```

### Discriminated Unions Over Boolean Flags

Use unions for mutually exclusive states.

```tsx
// Two booleans can conflict
type FormLabelProps = {
  isRequired?: boolean;
  isOptional?: boolean;
};

// One state at a time
type FormLabelProps = {
  modifier?: "required" | "optional";
};
```

```tsx
// Two booleans encoding three states
type DividerProps = {
  isVertical?: boolean;
  isHorizontal?: boolean;
};

// Single prop with default
type DividerProps = {
  orientation?: "vertical" | "horizontal"; // default: "horizontal"
};
```

For two truly independent booleans, booleans are fine. Use unions when three or more states compete or booleans are mutually exclusive.

### Extend Native Elements Correctly

When wrapping native elements, accept and forward remaining props. In React 19, `ref` is a regular prop.

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

Always destructure custom props and spread `...rest` onto the native element.

## Styling: Tailwind Vs Custom CSS

Default to Tailwind utilities. Write custom CSS only when Tailwind cannot express it.

| Situation                              | Approach                                                      |
| -------------------------------------- | ------------------------------------------------------------- |
| Layout, spacing, color, typography     | Tailwind utilities                                            |
| Dynamic value from data                | `style` prop (for example `style={{ width: pct + "%" }}`)     |
| Complex animation or pseudo-element    | Custom CSS in `globals.css` or CSS module                     |
| Tailwind utility with runtime variable | CSS custom property + Tailwind (for example `[--offset:8px]`) |

Never write custom CSS for something Tailwind can do. Avoid arbitrary values (`w-[372px]`) for spacing/sizing that belong in the design token scale.

Class organization inside `cn()`:

```tsx
className={cn(
  "flex flex-col gap-4 p-5", // layout + spacing
  "w-full max-w-screen-2xl", // sizing
  "bg-surface-default border-border-default", // colors
  "text-sm font-medium", // typography
  { "opacity-50 pointer-events-none": isDisabled }, // conditional states
  className, // external overrides last
)}
```
