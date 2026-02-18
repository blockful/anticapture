# Dashboard Package Guide

## Overview

- **Port**: 3000
- **Stack**: Next.js 16.1, React 19.2, Tailwind CSS 4.1, Apollo Client 3.13, wagmi 2.12, viem 2.37, Zustand 5.0, Recharts 2.15
- **Purpose**: Frontend application providing DAO governance analytics, risk assessment, and community tools

## What It Does

- Multi-DAO support (Uniswap, ENS, Optimism)
- Governance security analysis and risk assessment
- Attack profitability calculations
- Token distribution visualization
- Community petition system integration
- Wallet connection via RainbowKit
- Real-time data updates via GraphQL subscriptions

## Commands

```bash
# Development
pnpm dashboard dev              # Start Next.js dev server on :3000

# Building
pnpm dashboard build            # Production build
pnpm dashboard start            # Serve production build

# Testing
pnpm dashboard test             # Run Jest unit tests
pnpm dashboard test:watch       # Jest watch mode

# Verification (run after every change)
pnpm dashboard typecheck        # Type checking
pnpm dashboard lint             # Lint checking
pnpm dashboard lint:fix         # Auto-fix lint issues

# Storybook
pnpm dashboard storybook        # Start Storybook on :6006
pnpm dashboard build-storybook  # Build static Storybook
```

## Dependencies

- **API Gateway**: GraphQL endpoint for data fetching
- **GraphQL Client**: Generated types and hooks (`@anticapture/graphql-client`)
- **Wallet providers**: RainbowKit, wagmi, viem
- **External APIs**: Alchemy RPC, WalletConnect

## Environment Variables

Configure in `apps/dashboard/.env`:

| Variable                                | Required | Description                                                         |
| --------------------------------------- | -------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`                  | yes      | API Gateway GraphQL endpoint (e.g. `http://localhost:4000/graphql`) |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | yes      | WalletConnect project ID                                            |
| `NEXT_PUBLIC_ALCHEMY_KEY`               | yes      | Alchemy RPC key                                                     |
| `NEXT_PUBLIC_SITE_URL`                  | no       | Site URL for SEO/meta                                               |
| `RESEND_API_KEY`                        | no       | Resend email API key (contact form)                                 |
| `RESEND_FROM_EMAIL`                     | no       | Sender email address                                                |
| `CONTACT_EMAIL`                         | no       | Recipient for contact form                                          |

## Architecture

### Feature-Based Organization

The dashboard follows a **feature-based architecture** where each major domain has its own directory with all related code.

```
apps/dashboard/
├── app/                        # Next.js App Router pages
├── features/                   # Feature modules (domain-driven)
│   └── <feature-name>/
│       ├── components/         # Feature-specific components
│       ├── hooks/              # Feature-specific hooks
│       ├── contexts/           # Feature-specific React contexts
│       └── utils/              # Feature-specific utilities
├── shared/                     # Shared code across features
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   └── design-system/      # Design system components
│   ├── hooks/                  # Shared hooks
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utilities
│   └── lib/                    # External library configurations
├── templates/                  # Page-level templates
├── widgets/                    # Standalone UI components
└── public/                     # Static assets
```

## Where to Put New Code

| What you're adding          | Where it goes                      |
| --------------------------- | ---------------------------------- |
| New dashboard feature       | `features/<feature-name>/`         |
| Feature-specific component  | `features/<feature>/components/`   |
| Feature-specific hook       | `features/<feature>/hooks/`        |
| Feature-specific context    | `features/<feature>/contexts/`     |
| Feature-specific utility    | `features/<feature>/utils/`        |
| Reusable UI component       | `shared/components/ui/`            |
| Design system component     | `shared/components/design-system/` |
| Shared hook (cross-feature) | `shared/hooks/`                    |
| Shared utility function     | `shared/utils/`                    |
| Shared TypeScript types     | `shared/types/`                    |
| Page-level template         | `templates/`                       |
| Next.js route               | `app/`                             |
| Static assets               | `public/`                          |

## File Structure Guidelines

### Feature Module Structure

Each feature should be self-contained:

```
features/<feature-name>/
├── components/
│   ├── FeatureComponent.tsx
│   └── index.ts              # Re-export components
├── hooks/
│   ├── useFeatureData.ts
│   └── index.ts              # Re-export hooks
├── contexts/
│   └── FeatureContext.tsx
├── utils/
│   └── featureHelpers.ts
└── index.ts                  # Main feature export
```

### Component Structure

```typescript
// Component file structure
import {} from /* external deps */ "external-package";
import {} from /* shared components */ "@/shared/components";
import {} from /* shared utils */ "@/shared/utils";
import {} from /* feature code */ "../hooks";

// Types
interface ComponentProps {
  // ...
}

// Component
export const Component = ({ ...props }: ComponentProps) => {
  // ...
};
```

## Code Examples

### React Component with Tailwind

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/shared/utils";
import Spinner from "@/shared/components/ui/spinner";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  loading?: boolean;
  loadingText?: string;
}

export const Button = ({
  children,
  className,
  disabled = false,
  variant = "primary",
  loading = false,
  loadingText,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        "flex items-center justify-center gap-1.5 text-sm font-medium",
        variantStyles[variant],
        isDisabled && "pointer-events-none opacity-50",
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <Spinner label={loadingText} /> : children}
    </button>
  );
};
```

### Custom Hook with GraphQL

```typescript
import { useQuery } from "@apollo/client";
import { GET_DAO_DATA } from "@/shared/graphql/queries";

export function useDaoData(daoId: string) {
  const { data, loading, error } = useQuery(GET_DAO_DATA, {
    variables: { daoId },
  });

  return {
    dao: data?.dao,
    loading,
    error,
  };
}
```

### Context Provider

```typescript
import { createContext, useContext, useState } from "react";

interface FeatureContextValue {
  state: string;
  setState: (value: string) => void;
}

const FeatureContext = createContext<FeatureContextValue | undefined>(
  undefined,
);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState("");

  return (
    <FeatureContext.Provider value={{ state, setState }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error("useFeature must be used within FeatureProvider");
  }
  return context;
}
```

## Styling Guidelines

### Tailwind CSS Best Practices

- **Utility-first**: Prefer Tailwind utilities over custom CSS
- **Use `cn()` helper**: For conditional class merging
- **Responsive design**: Use Tailwind breakpoints (`sm:`, `md:`, `lg:`, etc.)
- **Design tokens**: Use Tailwind config for colors, spacing, etc.

### Class Organization

```tsx
// Order: layout → display → spacing → sizing → colors → typography → effects
<div
  className={cn(
    "flex items-center justify-between", // Layout
    "gap-4 px-6 py-4", // Spacing
    "rounded-lg border", // Sizing & borders
    "bg-white text-gray-900", // Colors
    "text-sm font-medium", // Typography
    "shadow-sm hover:shadow-md", // Effects
    "transition-all duration-200", // Transitions
  )}
/>
```

## State Management

### Local State

- Use `useState` for component-local state
- Use `useReducer` for complex state logic

### Global State

- **React Context**: For feature-scoped state
- **Zustand**: For app-wide state (user preferences, UI state)
- **Apollo Client**: For server state (GraphQL data)

### Server State

```typescript
// Apollo Client for GraphQL queries
import { useQuery } from "@apollo/client";

const { data, loading, error, refetch } = useQuery(QUERY, {
  variables: { id },
});
```

## Testing Strategy

### Unit Tests (Jest)

```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<Button loading loadingText="Loading...">Click</Button>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
```

### Component Tests (Vitest + Storybook)

```typescript
// Component.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Components/Button",
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
};

export const Loading: Story = {
  args: {
    children: "Loading Button",
    loading: true,
  },
};
```

## Path Aliases

Use TypeScript path aliases for cleaner imports:

```typescript
// ✅ Good
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils";

// ❌ Bad
import { Button } from "../../../shared/components/ui/button";
import { cn } from "../../../shared/utils";
```

## Development Workflow

1. **Start dependencies**: Ensure API Gateway is running
2. **Generate GraphQL types**: `pnpm client codegen` (if schema changed)
3. **Start dev server**: `pnpm dashboard dev`
4. **Make changes**: Edit components/features
5. **Test locally**: View at `http://localhost:3000`
6. **Verify**: `pnpm dashboard typecheck && pnpm dashboard lint && pnpm dashboard test`
7. **Visual testing**: Use Storybook for component isolation

## Common Issues

### GraphQL Errors

- **Endpoint not reachable**: Check `NEXT_PUBLIC_BASE_URL` is correct
- **Type mismatch**: Run `pnpm client codegen` to regenerate types
- **Query fails**: Check API Gateway and backend APIs are running

### Build Errors

- **Import errors**: Check path aliases in `tsconfig.json`
- **Environment variables**: Ensure all `NEXT_PUBLIC_*` vars are set
- **Type errors**: Run `pnpm dashboard typecheck` to identify issues

### Styling Issues

- **Tailwind not working**: Check `tailwind.config.ts` paths
- **Custom CSS not applied**: Ensure styles are imported in `app/layout.tsx`
- **Dark mode issues**: Check Tailwind dark mode configuration

## Performance Optimization

- **Code splitting**: Use dynamic imports for heavy components
- **Image optimization**: Use Next.js `<Image>` component
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` judiciously
- **Lazy loading**: Load charts and heavy components on demand

## Accessibility

- **Semantic HTML**: Use appropriate HTML elements
- **ARIA labels**: Add labels for screen readers
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **Focus management**: Handle focus states properly

## Related Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react)
- Root `AGENTS.md` for general guidelines
- `packages/graphql-client/AGENTS.md` for GraphQL client usage
