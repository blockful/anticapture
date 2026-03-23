# Configurable Initial Page per DAO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow each DAO to configure which page users land on when visiting `/{daoId}/`, defaulting to the existing overview.

**Architecture:** Add an optional `initialPage` field to `DaoConfiguration`. When set, the DAO root page issues a Next.js server-side `redirect()`. A unit test validates that every DAO's `initialPage` points to an enabled feature, catching misconfigurations before they ship. `getDaoNavigationPath` also respects `initialPage` as its fallback to avoid double redirects when switching DAOs.

**Tech Stack:** TypeScript, Next.js (App Router), Jest

---

## File Map

| Action | File                                                  | Responsibility                                                                                                        |
| ------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Modify | `apps/dashboard/shared/dao-config/types.ts`           | Add `DaoFeaturePageSlug` type and `initialPage` field                                                                 |
| Modify | `apps/dashboard/shared/utils/dao-navigation.ts`       | Export `isFeatureEnabledForDao`, derive `DaoFeaturePage` from `DaoFeaturePageSlug`, use `initialPage` as nav fallback |
| Modify | `apps/dashboard/app/[daoId]/(main)/page.tsx`          | Add redirect logic                                                                                                    |
| Create | `apps/dashboard/shared/dao-config/dao-config.test.ts` | Config validation test                                                                                                |

---

### Task 1: Add `DaoFeaturePageSlug` type to config types and `initialPage` field

**Files:**

- Modify: `apps/dashboard/shared/dao-config/types.ts:132-146`

Define `DaoFeaturePageSlug` in the config types file (its natural home) and add the `initialPage` field. This avoids a circular type import — `dao-navigation.ts` already imports from `types.ts`, so types flow in one direction.

- [ ] **Step 1: Add the type and field**

In `apps/dashboard/shared/dao-config/types.ts`, add before the `DaoConfiguration` interface (before line 133):

```typescript
/** Feature page slugs — the set of pages a DAO can enable. */
export type DaoFeaturePageSlug =
  | "holders-and-delegates"
  | "governance"
  | "activity-feed"
  | "attack-profitability"
  | "resilience-stages"
  | "risk-analysis"
  | "token-distribution";
```

Then add inside the `DaoConfiguration` interface (after `serviceProviders?: boolean;` on line 145):

```typescript
  /** When set, visiting /{daoId}/ redirects to /{daoId}/{initialPage}. */
  initialPage?: DaoFeaturePageSlug;
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd apps/dashboard && pnpm typecheck`
Expected: No errors (additive changes, no consumers break)

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/shared/dao-config/types.ts
git commit -m "feat(dashboard): add DaoFeaturePageSlug type and initialPage config field"
```

---

### Task 2: Refactor `dao-navigation.ts` to derive `DaoFeaturePage` from `DaoFeaturePageSlug` and export `isFeatureEnabledForDao`

**Files:**

- Modify: `apps/dashboard/shared/utils/dao-navigation.ts:1-50`

`DaoFeaturePage` should derive from `DaoFeaturePageSlug` (adding `"/"`) instead of duplicating the slugs. Export `isFeatureEnabledForDao` so the test (Task 4) can use it.

- [ ] **Step 1: Update the type and export**

In `apps/dashboard/shared/utils/dao-navigation.ts`:

Update the import on line 2 to also import `DaoFeaturePageSlug`:

```typescript
import type {
  DaoConfiguration,
  DaoFeaturePageSlug,
} from "@/shared/dao-config/types";
```

Replace the `DaoFeaturePage` type definition (lines 5-13) with:

```typescript
export type DaoFeaturePage = "/" | DaoFeaturePageSlug;
```

Change `const isFeatureEnabledForDao` (line 26) to `export const isFeatureEnabledForDao`.

- [ ] **Step 2: Verify typecheck passes**

Run: `cd apps/dashboard && pnpm typecheck`
Expected: No errors (`DaoFeaturePage` resolves to the same union)

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/shared/utils/dao-navigation.ts
git commit -m "refactor(dashboard): derive DaoFeaturePage from DaoFeaturePageSlug, export isFeatureEnabledForDao"
```

---

### Task 3: Redirect logic in DAO root page

**Files:**

- Modify: `apps/dashboard/app/[daoId]/(main)/page.tsx:1-45`

Keep `generateMetadata` unchanged. Only modify the `DaoPage` component.

- [ ] **Step 1: Add redirect logic**

Add the `redirect` import at the top of the file:

```typescript
import { redirect } from "next/navigation";
```

Replace the `DaoPage` component (lines 33-45) with:

```typescript
export default async function DaoPage({
  params,
}: {
  params: Promise<{ daoId: string }>;
}) {
  const { daoId } = await params;
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoIdEnum];

  if (daoConfig?.initialPage) {
    redirect(`/${daoId.toLowerCase()}/${daoConfig.initialPage}`);
  }

  if (!daoConfig?.daoOverview) {
    redirect("/");
  }

  return <DaoOverviewSection daoId={daoIdEnum} />;
}
```

Key decisions:

- `redirect()` is a server-side function — no client flash
- Uses `daoId.toLowerCase()` to preserve URL casing convention
- If `initialPage` is set → redirect to that page
- If no `daoOverview` and no `initialPage` → redirect to `/` (app root, per spec)
- Otherwise → render overview as before

- [ ] **Step 2: Verify typecheck passes**

Run: `cd apps/dashboard && pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/app/[daoId]/(main)/page.tsx
git commit -m "feat(dashboard): redirect DAO root page based on initialPage config"
```

---

### Task 4: Update `getDaoNavigationPath` to respect `initialPage`

**Files:**

- Modify: `apps/dashboard/shared/utils/dao-navigation.ts:100-106`

When switching DAOs and the current page isn't available for the target DAO, the fallback should be `initialPage` (if set) rather than always `"/"`. This avoids a double redirect (nav to `/{daoId}/` → page redirects to `initialPage`).

- [ ] **Step 1: Update the fallback**

In `apps/dashboard/shared/utils/dao-navigation.ts`, change lines 100-106 from:

```typescript
const targetFeaturePage = isFeatureEnabledForDao(
  targetDaoConfig,
  currentFeaturePage,
)
  ? currentFeaturePage
  : "/";
```

To:

```typescript
const fallbackPage = targetDaoConfig.initialPage ?? "/";
const targetFeaturePage = isFeatureEnabledForDao(
  targetDaoConfig,
  currentFeaturePage,
)
  ? currentFeaturePage
  : fallbackPage;
```

No other changes needed — the return statement already handles both `"/"` and slug cases correctly.

- [ ] **Step 2: Verify typecheck passes**

Run: `cd apps/dashboard && pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/shared/utils/dao-navigation.ts
git commit -m "feat(dashboard): use initialPage as fallback in DAO navigation"
```

---

### Task 5: Config validation test

**Files:**

- Create: `apps/dashboard/shared/dao-config/dao-config.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import daoConfigByDaoId from "@/shared/dao-config";
import { isFeatureEnabledForDao } from "@/shared/utils/dao-navigation";

describe("DAO configuration validation", () => {
  const daoEntries = Object.entries(daoConfigByDaoId);

  it.each(daoEntries)(
    "%s: initialPage (if set) must point to an enabled feature",
    (_daoId, config) => {
      if (!config.initialPage) return;

      const isEnabled = isFeatureEnabledForDao(config, config.initialPage);
      expect(isEnabled).toBe(true);
    },
  );

  it.each(daoEntries)("%s: initialPage must not be '/'", (_daoId, config) => {
    // "/" is the default — setting it explicitly is a no-op bug
    expect(config.initialPage).not.toBe("/");
  });
});
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `cd apps/dashboard && pnpm test -- --testPathPattern=dao-config.test`
Expected: All tests PASS (no existing DAO sets `initialPage` yet)

- [ ] **Step 3: Verify a misconfiguration would fail**

Temporarily add `initialPage: "governance"` to a DAO that has `governancePage` unset (e.g., AAVE in `apps/dashboard/shared/dao-config/aave.ts`). Run the test. Confirm it fails with the expected assertion. Revert the change.

- [ ] **Step 4: Run lint**

Run: `cd apps/dashboard && pnpm lint`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/shared/dao-config/dao-config.test.ts
git commit -m "test(dashboard): validate initialPage points to enabled feature in all DAO configs"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run full typecheck**

Run: `cd apps/dashboard && pnpm typecheck`
Expected: No errors

- [ ] **Step 2: Run full test suite**

Run: `cd apps/dashboard && pnpm test`
Expected: All tests pass

- [ ] **Step 3: Run lint**

Run: `cd apps/dashboard && pnpm lint`
Expected: No errors
