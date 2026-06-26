This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Generated clients

```bash
pnpm gql-client dev
pnpm client dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## E2E Tests (Playwright)

Tests run against **live services** — feature data is not mocked.

### Prerequisites

The following environment variables must point to reachable services:

| Variable              | Purpose                          |
| --------------------- | -------------------------------- |
| `ANTICAPTURE_API_URL` | Gateful feature-flag service URL |

Analytics and noise requests may be blocked, but Gateful calls must be live.

Optionally set `PLAYWRIGHT_BASE_URL` to override the default `http://localhost:3000` target.

### Running E2E Tests

```bash
# Headless (default) — starts dev server automatically
pnpm dashboard test:e2e

# Headed browser (watch mode)
pnpm dashboard test:e2e:headed

# Interactive UI mode
pnpm dashboard test:e2e:ui
```

Tests live in `e2e/`. Coverage: Panel (`/`), DAO Overview (`/ens`), Holders & Delegates (`/ens/holders-and-delegates`), Proposals (`/ens/proposals`), Activity Feed (`/ens/activity-feed`), and mobile smoke tests at 390×844.

Live upstream outages or missing ENS data fail clearly rather than silently pass with mocked fallbacks.

## Deploy Anticapture on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# Folder structure

```
src/
  ├── features/
  │   ├── index.tsx
  │   ├── governance-activity/
  │   ├── token-distribution/
  │   │   ├── utils/
  │   │       ├── http-client/
  │   ├── dao-info/
  │   ├── attack-profitability/
  │   ├── show-support/
  │   │   ├── index.tsx <-- exports ShowSupport.tsx and ShowSupportStickyBar.tsx
  │   │   ├── ShowSupport.tsx
  │   │   ├── components/
  │   │   │   └── ShowSupportStickyBar.tsx
  │   │   ├── hooks/
  │   │   ├── utils/
  │   │   ├── types/
  │   │   └── test/ -- Test folder inside feature
  │   └── governance-implementation/
  │       ├── GovernanceImplementation.tsx
  │       ├── components/
  │       │   └── GovernanceImplementationSideBarButton.tsx  <-- export <SidebarButton title="Governance Implementation" icon anchorId>
  │       ├── hooks/
  │       ├── utils/
  │       └── test/
  ├── templates/ <-- Page templates, imports features
  │   ├── dao/
  │   └── home/
  ├── widgets/ <-- Components that are not a feature nor used by features or shared, widgets can also aggregate components of features
  │   └── sidebar/
  |       └──components/
  ├── shared/ <-- Components that are used by features
  │   ├── components/
  │   │   ├── shadcn/
  │   │   ├── ConnectCustom.tsx <-- Needs further discussion
  │   │   ├── buttons/
  │   │   │   └── SidebarButton.tsx
  │   │   └── icons/
  │   ├── contexts/
  │   ├── hooks/
  │   ├── client/
  │   ├── types/ -- Types: Interfaces, Enums, etc.
  │   │   └── dao.ts
  │   └── utils/ -- Utilitary and Constants
  │       └── dao-config/
  ├── public/
  └── app/
      ├── layout/
      └── routing/
```

kebab for folders
pascal for components
camel for functions
