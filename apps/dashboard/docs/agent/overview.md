# Dashboard Overview

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

## Architecture

### Principles

1. **Server-First**: Components are Server Components by default. Add `"use client"` only at interaction boundaries.
2. **Features are self-contained**: Each feature owns its components, hooks, utils, and types.
3. **No cross-feature imports**: Features must never import from other features. Move shared code to `shared/`.
4. **Thin pages, rich features**: Pages compose features; features own business logic.

### Folder Structure

```text
apps/dashboard/
├── app/                        # Next.js App Router (routing + composition only)
│   ├── (landing)/              # Public pages
│   ├── [daoId]/
│   │   ├── (shell)/            # Main DAO pages (sidebar layout)
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
