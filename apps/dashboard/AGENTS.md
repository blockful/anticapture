# Dashboard Package Guide

This file is intentionally small. Detailed guidance is split into focused docs under `apps/dashboard/docs/agent/`.

## Fast Path

```bash
pnpm dashboard dev
pnpm dashboard typecheck
pnpm dashboard lint
pnpm dashboard test
```

Run after every code change in this package:

```bash
pnpm dashboard typecheck && pnpm dashboard lint && pnpm dashboard test
```

## Hard Boundaries

- Keep feature logic in `features/*`; do not import from one feature into another.
- Move shared cross-feature code to `shared/*`.
- Use `@/*` path aliases.
- Server Components by default; add `"use client"` only at interactive boundaries.
- Do not run the indexer for dashboard tasks unless explicitly requested.

## Task Routing

- New page or route composition: `app/*`
- New dashboard capability: `features/<feature-name>/*`
- Reusable UI/hooks/utils/types: `shared/*`
- Cross-page composed sections: `widgets/*`

## Detailed Docs

- Overview, architecture, folder map, env vars, and commands:
  [docs/agent/overview.md](./docs/agent/overview.md)
- TypeScript/React conventions, import rules, naming, file structure:
  [docs/agent/code-conventions.md](./docs/agent/code-conventions.md)
- Component and hook design patterns, state rendering rules, styling approach:
  [docs/agent/engineering-patterns.md](./docs/agent/engineering-patterns.md)
- Data fetching choices, state management, bundle size, and testing:
  [docs/agent/data-state-testing.md](./docs/agent/data-state-testing.md)

## Root Reference

Global workflow, verification policy, and monorepo boundaries remain in root
[AGENTS.md](../../AGENTS.md).
