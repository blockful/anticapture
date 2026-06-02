# Dashboard Data, State, And Testing

## Data Fetching

| Context                      | Tool                                               |
| ---------------------------- | -------------------------------------------------- |
| Anticapture API data         | `@anticapture/client/hooks` (React Query REST SDK) |
| Other external (GitHub, ENS) | React Query (`@tanstack/react-query`)              |
| Form submissions             | React Query `useMutation`                          |
| URL-derived state            | `nuqs` (`useQueryState`)                           |
| Ephemeral UI state           | `useState`                                         |

```tsx
// Anticapture data — the DAO is a PATH param (first arg), not a header.
// Wrap the generated hook to normalize the return shape.
import { useProposals as useProposalsQuery } from "@anticapture/client/hooks";
import type { ProposalsPathParamsDaoEnumKey } from "@anticapture/client";

export const useProposals = (daoId: DaoIdEnum) => {
  const { data, isLoading, error } = useProposalsQuery(
    daoId.toLowerCase() as ProposalsPathParamsDaoEnumKey,
    { limit: 10, orderDirection: "desc" },
  );

  return {
    proposals: data?.items ?? [],
    isLoading,
    error,
  };
};

// React Query (other external sources)
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

## State Management

| State Type                | Solution                                  | Example                          |
| ------------------------- | ----------------------------------------- | -------------------------------- |
| URL/shareable state       | `nuqs` (`useQueryState`)                  | Filters, active tabs, pagination |
| Server data (Anticapture) | React Query cache (`@anticapture/client`) | DAO metrics, proposals, votes    |
| Server data (other)       | React Query cache                         | GitHub releases, ENS data        |
| Form state                | `react-hook-form`                         | Contact form, voting modal       |
| Ephemeral UI              | `useState`                                | Modal open/close, hover states   |
| Cross-component UI        | React Context (scoped)                    | Chart brush selection            |

## Bundle Size

- No barrel files (**enforced by ESLint** `no-restricted-imports`): import directly from source files.
- Direct icon imports: `import { CircleSlash } from "lucide-react"`; never import the full library.
- Use `next/dynamic` to lazy-load charts and heavy components.
- Use `optimizePackageImports` in `next.config.ts` for libraries that only offer barrel imports.

## Testing

- Hooks: `renderHook()` from `@testing-library/react`.
- Components: integration tests with data passed as props.
- E2E: Playwright for critical flows (DAO overview, governance).

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
