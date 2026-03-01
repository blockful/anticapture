---
name: anticapture-dashboard
description: Use for apps/dashboard work: routes, features, shared components/hooks, styling, data-fetching wiring, and dashboard tests.
---

# Dashboard Package Guide

## Use This Skill When

- You are editing files in `apps/dashboard`.
- You are adding or refactoring UI/features/routes.
- You are wiring data from GraphQL hooks into the UI.
- You are updating dashboard tests or lint/type issues.

## Package Snapshot

- Location: `apps/dashboard`
- Runtime: Next.js App Router
- UI: Tailwind + shared design-system components
- Data: `@anticapture/graphql-client` + Apollo hooks

## Architecture

```
apps/dashboard/
├── app/                        # Next.js routes, layouts, route handlers
├── features/                   # Feature modules (domain-driven)
│   └── <feature-name>/
├── shared/                     # Cross-feature components/services/types/utils
├── widgets/                    # Composed UI sections
└── public/                     # Static assets
```

## Workflow

1. Place code by ownership:
   - Feature-specific UI/logic in `features/<feature>/...`
   - Cross-feature primitives in `shared/...`
   - Higher-level composed sections in `widgets/...`
2. Reuse existing shared components before adding new primitives.
3. Keep route-level composition in `app/...`; avoid pushing route concerns into low-level components.
4. Verify:
   - `pnpm run --filter=@anticapture/dashboard typecheck`
   - `pnpm run --filter=@anticapture/dashboard lint`
   - `pnpm run --filter=@anticapture/dashboard test` (when behavior changes)

## Guardrails

- Do not add feature-specific logic into `shared` unless reused by multiple features.
- Prefer extending existing design-system/shared UI instead of creating near-duplicates.
