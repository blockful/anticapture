# Shareable Proposal Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Editor/Preview toggle to the proposal draft view, a read-only "Draft"-badged Preview that reuses the published-proposal rendering, and a recipient flow (shared link) where a non-author can Publish on-chain or Edit (fork a copy they own) — pixel-matched to Figma.

**Architecture:** All work lives in `apps/dashboard`. The backend (server-side draft CRUD + public `GET /proposal-drafts/{id}`), the share-link util, role detection, the publish flow, the threshold/VP hooks, and the "My Drafts" tab already exist on branch `feat/preview-drafts`. We add: (1) a pure `draftToProposalViewData` adapter, (2) a `useEncodedDraftActions` hook, (3) presentational Preview components (toggle, sidebar, layout) that reuse `DescriptionTabContent` / `ActionsTabContent`, (4) a `view=editor|preview` query-param mode and recipient branching inside `ProposalCreationForm`, (5) a fork-on-edit handler, and (6) copy/label fixes. The recipient's editable fields are never rendered (read-only surface); form state is still hydrated so the existing Publish path works, and the backend rejects non-author writes.

**Tech Stack:** Next.js (App Router), React, TypeScript, react-hook-form, `nuqs` (query-param state), wagmi/viem, RainbowKit, `@anticapture/client` (generated SDK), Tailwind, Vitest + Testing Library, react-hot-toast.

**Spec:** `docs/superpowers/specs/2026-06-23-shareable-proposal-drafts-design.md`

**Figma:** file `mUgy2KpQ3gJ07yZaUaXu8l` — Editor `3178:85658`, author Preview `3178:89621`, drafts list `3178:89569`, recipient connected `3187:115`, recipient not-connected `3187:1487`, recipient below-threshold `3187:2563`, toast `3179:91125`, mobile editor `3179:91128`.

**Commit convention:** Conventional Commits, scope `dashboard`. No `Co-Authored-By` trailer (user preference). Branch is `feat/preview-drafts` (already checked out) — commit directly to it.

**Per-task close-out (do this at the end of every task before its commit):**

```bash
pnpm dashboard typecheck
pnpm dashboard lint
```

Both must pass with no new errors. Run the task's tests with:

```bash
pnpm dashboard test -- <test-file-path>
```

(If `pnpm dashboard test` is not wired, fall back to `pnpm --filter @anticapture/dashboard test`. Confirm the runner once at Task 1 and reuse it.)

---

## File map

**Create:**

- `apps/dashboard/features/create-proposal/utils/draftToProposalViewData.ts` — pure draft→`ProposalViewData` adapter.
- `apps/dashboard/features/create-proposal/utils/draftToProposalViewData.test.ts` — adapter tests.
- `apps/dashboard/features/create-proposal/hooks/useEncodedDraftActions.ts` — async-encode draft actions for the Actions tab.
- `apps/dashboard/features/create-proposal/hooks/useEncodedDraftActions.test.ts` — hook mapping tests.
- `apps/dashboard/features/create-proposal/utils/draftThresholdCopy.ts` — dynamic recipient helper-copy builder.
- `apps/dashboard/features/create-proposal/utils/draftThresholdCopy.test.ts` — copy builder tests.
- `apps/dashboard/features/create-proposal/components/preview/DraftViewToggle.tsx` — Editor/Preview segmented control.
- `apps/dashboard/features/create-proposal/components/preview/DraftPreviewSidebar.tsx` — left column (badge, "Draft • author", title, actions, helper copy).
- `apps/dashboard/features/create-proposal/components/preview/DraftPreview.tsx` — composes sidebar + reused Description/Actions tabs.

**Modify:**

- `apps/dashboard/features/create-proposal/types/index.ts` — add `author` to `ProposalDraft`.
- `apps/dashboard/features/create-proposal/hooks/useDrafts.ts` — map `author` in `toDraft`.
- `apps/dashboard/features/governance/components/proposal-overview/TabsSection.tsx` — accept `variant: "draft"` to hide the Votes tab and accept encoded draft actions.
- `apps/dashboard/features/create-proposal/components/ProposalCreationForm.tsx` — view-mode param, role-based branching, render Editor vs Preview, fork-on-edit, recipient top-bar Connect Wallet, copy fixes.
- `apps/dashboard/features/create-proposal/components/drafts/DraftCard.tsx` — "Share"→"Copy Link", "Updated…"→"Draft • [time]", row click → Editor.
- `apps/dashboard/features/create-proposal/components/ProposalFormNavBar.tsx` — "Copy link"→"Copy Link".
- `apps/dashboard/features/create-proposal/components/preview/index.ts` (barrel, optional) — export preview components.

---

## Task 1: Add `author` to the draft domain type

**Files:**

- Modify: `apps/dashboard/features/create-proposal/types/index.ts`
- Modify: `apps/dashboard/features/create-proposal/hooks/useDrafts.ts:40-50`

The recipient view must show "Draft • [original author]" even when another wallet is connected. The API already returns `author` on every draft; we surface it on the domain type.

- [ ] **Step 1: Add `author` to `ProposalDraft`**

In `types/index.ts`, change the `ProposalDraft` type:

```ts
export type ProposalDraft = ProposalContent & {
  id: string;
  daoId: string;
  /** Wallet address that originally created the draft (lowercased 0x string). */
  author: string;
  createdAt: number;
  updatedAt: number;
  actions: ProposalAction[];
};
```

- [ ] **Step 2: Map `author` in `toDraft`**

In `useDrafts.ts`, update the `toDraft` mapper (currently lines 40-50) to include `author`:

```ts
const toDraft = (d: DraftProposal): ProposalDraft => ({
  id: d.id,
  daoId: d.daoId,
  author: d.author,
  title: d.title,
  discussionUrl: d.discussionUrl,
  body: d.body,
  // API returns actions as unknown[] (open JSON objects); cast is intentional
  actions: d.actions as unknown as ProposalAction[],
  createdAt: Number(d.createdAt),
  updatedAt: Number(d.updatedAt),
});
```

If TypeScript reports `d.author` does not exist on `DraftProposal`, the SDK type lacks it — confirm with:

```bash
grep -rn "author" node_modules/@anticapture/client/dist/*.d.ts | head
```

If the field is genuinely absent from the generated type (it should be present — the controller returns it), STOP and report; do not cast. Otherwise proceed.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm dashboard typecheck && pnpm dashboard lint`
Expected: PASS (no new errors).

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/features/create-proposal/types/index.ts apps/dashboard/features/create-proposal/hooks/useDrafts.ts
git commit -m "feat(dashboard): surface draft author on the domain type"
```

---

## Task 2: Pure adapter — `draftToProposalViewData`

**Files:**

- Create: `apps/dashboard/features/create-proposal/utils/draftToProposalViewData.ts`
- Test: `apps/dashboard/features/create-proposal/utils/draftToProposalViewData.test.ts`

Mirrors the `adaptedOffchainProposal` block in `ProposalSection.tsx` (lines 182-213): produces a `ProposalViewData` with the draft's content, zeroed votes/quorum and null timestamps so the reused render shows no voting/timeline data. `description` is set to the draft body (`DescriptionTabContent` nullifies `h1`, and the title is shown in the sidebar). Encoded actions are injected separately (Task 3), so this adapter takes them as an argument.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { draftToProposalViewData } from "./draftToProposalViewData";
import type { ProposalDraft } from "@/features/create-proposal/types";

const draft: ProposalDraft = {
  id: "draft-1",
  daoId: "ens",
  author: "0xAUTHOR",
  title: "My Draft Title",
  discussionUrl: "https://discuss.example/123",
  body: "## Abstract\nDoes a thing.",
  createdAt: 1000,
  updatedAt: 2000,
  actions: [],
};

describe("draftToProposalViewData", () => {
  it("maps draft content with zeroed votes and null timestamps", () => {
    const result = draftToProposalViewData(draft, {
      targets: [],
      values: [],
      calldatas: [],
    });

    expect(result.id).toBe("draft-1");
    expect(result.daoId).toBe("ens");
    expect(result.title).toBe("My Draft Title");
    expect(result.proposerAccountId).toBe("0xAUTHOR");
    // Body becomes the markdown description; title lives in the sidebar.
    expect(result.description).toBe("## Abstract\nDoes a thing.");
    expect(result.forVotes).toBe("0");
    expect(result.againstVotes).toBe("0");
    expect(result.abstainVotes).toBe("0");
    expect(result.quorum).toBe("0");
    expect(result.startTimestamp).toBeNull();
    expect(result.endTimestamp).toBeNull();
    expect(result.queuedTimestamp).toBeNull();
    expect(result.executedTimestamp).toBeNull();
  });

  it("passes encoded actions through to targets/values/calldatas", () => {
    const result = draftToProposalViewData(draft, {
      targets: ["0xTARGET"],
      values: ["0"],
      calldatas: ["0xdeadbeef"],
    });

    expect(result.targets).toEqual(["0xTARGET"]);
    expect(result.values).toEqual(["0"]);
    expect(result.calldatas).toEqual(["0xdeadbeef"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm dashboard test -- features/create-proposal/utils/draftToProposalViewData.test.ts`
Expected: FAIL — `Cannot find module './draftToProposalViewData'`.

- [ ] **Step 3: Implement the adapter**

```ts
import type { ProposalDraft } from "@/features/create-proposal/types";
import {
  ProposalStatus,
  type ProposalViewData,
} from "@/features/governance/types";

/** Encoded calldata bundle for the draft's actions (see useEncodedDraftActions). */
export interface EncodedDraftActions {
  targets: Array<string | null>;
  values: Array<string | null>;
  calldatas: Array<string | null>;
}

/**
 * Adapts a local draft into the `ProposalViewData` shape consumed by the
 * published-proposal renderers (DescriptionTabContent / ActionsTabContent),
 * with all on-chain/voting fields zeroed or nulled. Mirrors the
 * `adaptedOffchainProposal` mapping in ProposalSection.tsx.
 *
 * `description` is the draft body: DescriptionTabContent overrides `h1` to
 * render nothing, and the title is shown separately in the Preview sidebar.
 */
export const draftToProposalViewData = (
  draft: ProposalDraft,
  encoded: EncodedDraftActions,
): ProposalViewData => ({
  id: draft.id,
  daoId: draft.daoId,
  txHash: null,
  proposerAccountId: draft.author as `0x${string}`,
  title: draft.title,
  description: draft.body,
  quorum: "0",
  timestamp: draft.createdAt.toString(),
  status: ProposalStatus.PENDING,
  forVotes: "0",
  againstVotes: "0",
  abstainVotes: "0",
  startTimestamp: null,
  endTimestamp: null,
  startBlock: 0,
  endBlock: 0,
  queuedTimestamp: null,
  executedTimestamp: null,
  queuedTxHash: null,
  executedTxHash: null,
  calldatas: encoded.calldatas,
  targets: encoded.targets,
  values: encoded.values,
  proposalType: null,
});
```

> Note: `ProposalViewData` is a broad generated type. If `typecheck` reports missing required fields beyond those above, add them by copying the exact field + value used in the `adaptedOffchainProposal` object in `apps/dashboard/features/governance/components/proposal-overview/ProposalSection.tsx` (lines ~182-213). If it reports `timestamp` should be a `number`/different type, match the type used there. Do not cast to `any`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm dashboard test -- features/create-proposal/utils/draftToProposalViewData.test.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm dashboard typecheck && pnpm dashboard lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/features/create-proposal/utils/draftToProposalViewData.ts apps/dashboard/features/create-proposal/utils/draftToProposalViewData.test.ts
git commit -m "feat(dashboard): add draft-to-proposal-view-data adapter"
```

---

## Task 3: `useEncodedDraftActions` hook

**Files:**

- Create: `apps/dashboard/features/create-proposal/hooks/useEncodedDraftActions.ts`
- Test: `apps/dashboard/features/create-proposal/hooks/useEncodedDraftActions.test.ts`

The Actions tab reuses `ActionsTabContent`, which expects `{ targets, values, calldatas }`. We encode the draft's structured actions with the same `encodeActions` + ENS-resolver path the publish flow uses (`usePublishProposal.ts:104-122`), so Preview shows exactly what will be submitted. Wrapped in `useQuery` for caching + loading/error states.

- [ ] **Step 1: Write the failing test**

We test the encode → string-bundle mapping by mocking `encodeActions`. `useQuery` is driven through a real `QueryClientProvider`.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/create-proposal/utils/encodeActions", () => ({
  encodeActions: vi.fn(async () => ({
    targets: ["0xabc"],
    values: [123n],
    calldatas: ["0xdead"],
  })),
  makeAddressResolver: vi.fn(() => async (x: string) => x as `0x${string}`),
}));

vi.mock("wagmi", () => ({
  usePublicClient: () => ({ getEnsAddress: async () => null }),
}));

import { useEncodedDraftActions } from "./useEncodedDraftActions";

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe("useEncodedDraftActions", () => {
  it("stringifies bigint values and returns the encoded bundle", async () => {
    const { result } = renderHook(() => useEncodedDraftActions([], "ens"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.encoded).toEqual({
      targets: ["0xabc"],
      values: ["123"],
      calldatas: ["0xdead"],
    });
    expect(result.current.error).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm dashboard test -- features/create-proposal/hooks/useEncodedDraftActions.test.ts`
Expected: FAIL — `Cannot find module './useEncodedDraftActions'`.

- [ ] **Step 3: Implement the hook**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { normalize } from "viem/ens";
import { usePublicClient } from "wagmi";
import { mainnet } from "wagmi/chains";

import {
  encodeActions,
  makeAddressResolver,
} from "@/features/create-proposal/utils/encodeActions";
import type { ProposalAction } from "@/features/create-proposal/types";
import type { EncodedDraftActions } from "@/features/create-proposal/utils/draftToProposalViewData";

const EMPTY: EncodedDraftActions = { targets: [], values: [], calldatas: [] };

/**
 * Encodes a draft's structured actions into the {targets,values,calldatas}
 * string bundle consumed by ActionsTabContent. Uses the same ENS resolver as
 * the publish flow so the Preview matches what will be submitted on-chain.
 */
export const useEncodedDraftActions = (
  actions: ProposalAction[],
  daoId: string,
): {
  encoded: EncodedDraftActions;
  isLoading: boolean;
  error: Error | null;
} => {
  const ensClient = usePublicClient({ chainId: mainnet.id });

  const query = useQuery({
    queryKey: ["encoded-draft-actions", daoId, actions],
    enabled: actions.length > 0 && !!ensClient,
    queryFn: async (): Promise<EncodedDraftActions> => {
      if (!ensClient) return EMPTY;
      const resolver = makeAddressResolver(async (name) =>
        ensClient.getEnsAddress({ name: normalize(name) }),
      );
      const result = await encodeActions(actions, resolver);
      return {
        targets: result.targets,
        values: result.values.map((v) => v.toString()),
        calldatas: result.calldatas,
      };
    },
  });

  return {
    encoded: actions.length === 0 ? EMPTY : (query.data ?? EMPTY),
    isLoading: query.isLoading && actions.length > 0,
    error: (query.error as Error | null) ?? null,
  };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm dashboard test -- features/create-proposal/hooks/useEncodedDraftActions.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm dashboard typecheck && pnpm dashboard lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/features/create-proposal/hooks/useEncodedDraftActions.ts apps/dashboard/features/create-proposal/hooks/useEncodedDraftActions.test.ts
git commit -m "feat(dashboard): encode draft actions for preview"
```

---

## Task 4: Dynamic recipient helper-copy builder

**Files:**

- Create: `apps/dashboard/features/create-proposal/utils/draftThresholdCopy.ts`
- Test: `apps/dashboard/features/create-proposal/utils/draftThresholdCopy.test.ts`

Builds the per-state helper copy shown in the Preview sidebar. The below-threshold copy is dynamic (real threshold, token symbol, recipient VP), per the spec.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { draftPreviewCopy } from "./draftThresholdCopy";

describe("draftPreviewCopy", () => {
  it("author copy mentions sharing", () => {
    expect(draftPreviewCopy({ role: "author" })).toBe(
      "This draft hasn't been submitted on-chain yet. Share the link so someone can review it, or submit it for you.",
    );
  });

  it("recipient connected with enough VP", () => {
    expect(draftPreviewCopy({ role: "recipient", state: "eligible" })).toBe(
      "This draft was shared with you. Review it, then publish it on-chain. You can also edit it to make your own copy.",
    );
  });

  it("recipient not connected", () => {
    expect(draftPreviewCopy({ role: "recipient", state: "disconnected" })).toBe(
      "This draft was shared with you. Connect your wallet to publish it on-chain, or edit it to make your own copy.",
    );
  });

  it("recipient below threshold uses dynamic numbers", () => {
    expect(
      draftPreviewCopy({
        role: "recipient",
        state: "below-threshold",
        thresholdDisplay: "100K",
        vpDisplay: "38K",
        tokenSymbol: "ENS",
      }),
    ).toBe(
      "You need 100K ENS to submit a proposal. This wallet holds 38K. Ask someone with enough voting power to publish it, or edit it to make your own copy.",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm dashboard test -- features/create-proposal/utils/draftThresholdCopy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the copy builder**

```ts
export type DraftPreviewCopyInput =
  | { role: "author" }
  | { role: "recipient"; state: "eligible" }
  | { role: "recipient"; state: "disconnected" }
  | {
      role: "recipient";
      state: "below-threshold";
      thresholdDisplay: string;
      vpDisplay: string;
      tokenSymbol: string;
    };

export const draftPreviewCopy = (input: DraftPreviewCopyInput): string => {
  if (input.role === "author") {
    return "This draft hasn't been submitted on-chain yet. Share the link so someone can review it, or submit it for you.";
  }
  switch (input.state) {
    case "eligible":
      return "This draft was shared with you. Review it, then publish it on-chain. You can also edit it to make your own copy.";
    case "disconnected":
      return "This draft was shared with you. Connect your wallet to publish it on-chain, or edit it to make your own copy.";
    case "below-threshold":
      return `You need ${input.thresholdDisplay} ${input.tokenSymbol} to submit a proposal. This wallet holds ${input.vpDisplay}. Ask someone with enough voting power to publish it, or edit it to make your own copy.`;
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm dashboard test -- features/create-proposal/utils/draftThresholdCopy.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + lint, then commit**

```bash
pnpm dashboard typecheck && pnpm dashboard lint
git add apps/dashboard/features/create-proposal/utils/draftThresholdCopy.ts apps/dashboard/features/create-proposal/utils/draftThresholdCopy.test.ts
git commit -m "feat(dashboard): add draft preview helper-copy builder"
```

---

## Task 5: `DraftViewToggle` (Editor/Preview segmented control)

**Files:**

- Create: `apps/dashboard/features/create-proposal/components/preview/DraftViewToggle.tsx`
- Figma: `3178:85658` (top bar), recipient `3187:115` (Preview only).

Two pill buttons: `✎ Editor` and `▷ Preview`; the active one is highlighted. When `showEditor` is false (recipient), only the Preview pill renders (locked).

- [ ] **Step 1: Implement the component**

```tsx
"use client";

import { Eye, Pencil } from "lucide-react";

import { cn } from "@/shared/utils/cn";

export type DraftViewMode = "editor" | "preview";

interface DraftViewToggleProps {
  mode: DraftViewMode;
  onChange: (mode: DraftViewMode) => void;
  /** Recipients see Preview only — the Editor pill is hidden. */
  showEditor?: boolean;
}

const pill = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[14px] font-medium leading-5 transition-colors",
    active
      ? "border-link text-link bg-surface-default"
      : "border-border-default text-secondary hover:text-primary",
  );

export const DraftViewToggle = ({
  mode,
  onChange,
  showEditor = true,
}: DraftViewToggleProps) => (
  <div
    role="tablist"
    aria-label="Draft view"
    className="flex items-center gap-2"
  >
    {showEditor && (
      <button
        type="button"
        role="tab"
        aria-selected={mode === "editor"}
        className={pill(mode === "editor")}
        onClick={() => onChange("editor")}
      >
        <Pencil className="size-4" />
        Editor
      </button>
    )}
    <button
      type="button"
      role="tab"
      aria-selected={mode === "preview"}
      className={pill(mode === "preview")}
      onClick={() => onChange("preview")}
    >
      <Eye className="size-4" />
      Preview
    </button>
  </div>
);
```

- [ ] **Step 2: Verify against Figma**

Compare the rendered toggle with Figma node `3178:85658` (active = blue border/text per the design tokens). Adjust the `border-link`/`text-link` token names if the design system uses different token classes (grep `text-link` usage in `apps/dashboard/features/governance` to confirm the token exists). The icon glyphs are pencil (Editor) and a play/eye (Preview) — match the Figma glyph; if Figma uses a play triangle, swap `Eye` for `Play` from `lucide-react`.

- [ ] **Step 3: Typecheck + lint, then commit**

```bash
pnpm dashboard typecheck && pnpm dashboard lint
git add apps/dashboard/features/create-proposal/components/preview/DraftViewToggle.tsx
git commit -m "feat(dashboard): add editor/preview toggle control"
```

---

## Task 6: `DraftPreviewSidebar` (left column)

**Files:**

- Create: `apps/dashboard/features/create-proposal/components/preview/DraftPreviewSidebar.tsx`
- Figma: author `3178:89621`, recipient `3187:115` / `3187:1487` / `3187:2563`.

The left column: a "Draft" badge + "Draft • [author]" line (always the original author), the title, the primary action row, and the helper copy. It is presentational — all behavior comes in as props.

- [ ] **Step 1: Implement the component**

```tsx
"use client";

import { Link2, Pencil, Rocket } from "lucide-react";
import type { Address } from "viem";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";

interface DraftPreviewSidebarProps {
  title: string;
  authorAddress: string;
  helperCopy: string;
  /** Author sees Copy Link; recipient sees Edit. */
  secondaryAction: "copy-link" | "edit";
  onPublish: () => void;
  onCopyLink: () => void;
  onEdit: () => void;
  publishDisabled?: boolean;
}

export const DraftPreviewSidebar = ({
  title,
  authorAddress,
  helperCopy,
  secondaryAction,
  onPublish,
  onCopyLink,
  onEdit,
  publishDisabled = false,
}: DraftPreviewSidebarProps) => (
  <div className="flex w-full flex-col gap-4">
    <div className="flex items-center gap-2">
      <BadgeStatus variant="outline">Draft</BadgeStatus>
      <span className="text-secondary flex items-center gap-1 text-sm">
        Draft •
        <EnsAvatar
          size="xs"
          address={authorAddress as Address}
          nameClassName="text-secondary"
        />
      </span>
    </div>

    <h4 className="text-primary text-xl">{title}</h4>

    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="md"
        disabled={publishDisabled}
        onClick={onPublish}
      >
        <Rocket className="size-4" />
        Publish
      </Button>
      {secondaryAction === "copy-link" ? (
        <Button variant="outline" size="md" onClick={onCopyLink}>
          <Link2 className="size-4" />
          Copy Link
        </Button>
      ) : (
        <Button variant="outline" size="md" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
      )}
    </div>

    <p className="text-secondary text-sm leading-5">{helperCopy}</p>
  </div>
);
```

- [ ] **Step 2: Verify against Figma**

Match spacing/typography against `3178:89621` (author) and `3187:115` (recipient). Confirm `EnsAvatar` props (`size`, `nameClassName`) by reuse in `TitleSection.tsx:80-86`. Confirm `BadgeStatus` accepts `variant="outline"` (it's used the same way in `DraftCard.tsx:29`).

- [ ] **Step 3: Typecheck + lint, then commit**

```bash
pnpm dashboard typecheck && pnpm dashboard lint
git add apps/dashboard/features/create-proposal/components/preview/DraftPreviewSidebar.tsx
git commit -m "feat(dashboard): add draft preview sidebar"
```

---

## Task 7: Add a `draft` variant to `TabsSection`

**Files:**

- Modify: `apps/dashboard/features/governance/components/proposal-overview/TabsSection.tsx`

In draft mode the tab set is **Description + Actions only** (no Votes). The component already renders those two contents; we add a `variant` prop that drops the Votes tab and skips offchain wiring. Published behavior is unchanged when `variant` is omitted.

- [ ] **Step 1: Add the `variant` prop and gate the Votes tab**

Update the props interface and the tab construction. Replace the `allowedTabs`/`tabs` logic (lines 40-86) so that when `variant === "draft"`:

- `allowedTabs = ["description", "actions"]`
- the `tabs` array is `[{ label: "Description", value: "description" }, { label: "Actions", value: "actions" }]`
- the `votes` case is never reachable (default tab is `description`; no Votes tab to select).

Concretely:

```tsx
interface TabsSectionProps {
  proposal: ProposalViewData;
  onAddressClick?: (address: string) => void;
  isOffchain?: boolean;
  isWhitelabel?: boolean;
  offchainProposalId?: string;
  offchainChoices?: string[];
  offchainScores?: number[];
  offchainProposalType?: string | null;
  daoId?: DaoIdEnum;
  /** "draft" → Description + Actions only, no Votes. */
  variant?: "default" | "draft";
}
```

In the body:

```tsx
  variant = "default",
}: TabsSectionProps) => {
  const isDraft = variant === "draft";
  const allowedTabs: TabId[] = isDraft
    ? ["description", "actions"]
    : isOffchain
      ? ["description", "votes"]
      : ["description", "votes", "actions"];
```

And the `tabs` array:

```tsx
const tabs = isDraft
  ? [
      { label: "Description", value: "description" },
      { label: "Actions", value: "actions" },
    ]
  : [
      { label: "Description", value: "description" },
      { label: "Votes", value: "votes" },
      ...(!isOffchain ? [{ label: "Actions", value: "actions" }] : []),
    ];
```

Leave `renderTabContent` as-is — `description` and `actions` cases already work for the adapted draft proposal; the `votes` case is unreachable in draft mode.

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm dashboard typecheck && pnpm dashboard lint`
Expected: PASS. (Published proposal pages still pass `variant` undefined → unchanged behavior.)

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/features/governance/components/proposal-overview/TabsSection.tsx
git commit -m "feat(dashboard): add draft variant to proposal tabs"
```

---

## Task 8: `DraftPreview` (compose sidebar + reused tabs)

**Files:**

- Create: `apps/dashboard/features/create-proposal/components/preview/DraftPreview.tsx`

Two-column layout matching `ProposalSection`'s container (sidebar left, tabs right). It builds the adapted proposal from the draft + encoded actions and renders `TabsSection variant="draft"`.

- [ ] **Step 1: Implement the component**

```tsx
"use client";

import { useEncodedDraftActions } from "@/features/create-proposal/hooks/useEncodedDraftActions";
import { draftToProposalViewData } from "@/features/create-proposal/utils/draftToProposalViewData";
import { DraftPreviewSidebar } from "@/features/create-proposal/components/preview/DraftPreviewSidebar";
import type { ProposalAction } from "@/features/create-proposal/types";
import { TabsSection } from "@/features/governance/components/proposal-overview/TabsSection";
import type { DaoIdEnum } from "@/shared/types/daos";

interface DraftPreviewProps {
  daoId: string;
  daoIdEnum: DaoIdEnum;
  title: string;
  discussionUrl: string;
  body: string;
  actions: ProposalAction[];
  authorAddress: string;
  helperCopy: string;
  secondaryAction: "copy-link" | "edit";
  onPublish: () => void;
  onCopyLink: () => void;
  onEdit: () => void;
  publishDisabled?: boolean;
}

export const DraftPreview = ({
  daoId,
  daoIdEnum,
  title,
  discussionUrl,
  body,
  actions,
  authorAddress,
  helperCopy,
  secondaryAction,
  onPublish,
  onCopyLink,
  onEdit,
  publishDisabled,
}: DraftPreviewProps) => {
  const { encoded } = useEncodedDraftActions(actions, daoId);

  const proposal = draftToProposalViewData(
    {
      id: "preview",
      daoId,
      author: authorAddress,
      title,
      discussionUrl,
      body,
      actions,
      createdAt: 0,
      updatedAt: 0,
    },
    encoded,
  );

  return (
    <div className="flex flex-col gap-6 p-5 lg:flex-row lg:pt-0">
      <div className="flex h-fit w-full flex-col gap-4 lg:sticky lg:top-[85px] lg:w-[420px]">
        <DraftPreviewSidebar
          title={title}
          authorAddress={authorAddress}
          helperCopy={helperCopy}
          secondaryAction={secondaryAction}
          onPublish={onPublish}
          onCopyLink={onCopyLink}
          onEdit={onEdit}
          publishDisabled={publishDisabled}
        />
      </div>
      <TabsSection proposal={proposal} daoId={daoIdEnum} variant="draft" />
    </div>
  );
};
```

- [ ] **Step 2: Verify against Figma**

Compare the two-column layout with `3178:89621`. The container classes mirror `ProposalSection.tsx:270-299` (sidebar `lg:w-[420px]`, tabs fill). Adjust gaps/padding to match the design.

- [ ] **Step 3: Typecheck + lint, then commit**

```bash
pnpm dashboard typecheck && pnpm dashboard lint
git add apps/dashboard/features/create-proposal/components/preview/DraftPreview.tsx
git commit -m "feat(dashboard): add read-only draft preview view"
```

---

## Task 9: Wire view-mode + role + Preview into `ProposalCreationForm`

**Files:**

- Modify: `apps/dashboard/features/create-proposal/components/ProposalCreationForm.tsx`

This is the integration task. Add a `view=editor|preview` param, compute the viewer role and recipient VP state, render the top-bar toggle, render Preview vs Editor, and fix the copy-link toast text.

- [ ] **Step 1: Add imports and view-mode state**

Add to the import block (top of file):

```tsx
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { DraftViewToggle } from "@/features/create-proposal/components/preview/DraftViewToggle";
import { DraftPreview } from "@/features/create-proposal/components/preview/DraftPreview";
import { draftPreviewCopy } from "@/features/create-proposal/utils/draftThresholdCopy";
```

Inside the component, after the existing hooks (near line 103), add:

```tsx
const { openConnectModal } = useConnectModal();
const [view, setView] = useQueryState(
  "view",
  parseAsStringEnum<"editor" | "preview">(["editor", "preview"]).withDefault(
    "editor",
  ),
);
```

- [ ] **Step 2: Track the shared draft's author and derive the viewer role**

The existing `draftId` effect already fetches the shared draft and decides author vs recipient. Add a `sharedAuthor` state and set it in that effect.

Add state near the other `useState` calls (after line 174):

```tsx
const [sharedAuthor, setSharedAuthor] = useState<string | undefined>(undefined);
```

In the `getDraftProposal(...).then((shared) => { ... })` block (around lines 144-159), after `if (!shared) return;` add:

```tsx
setSharedAuthor(shared.author);
```

Then derive role (after `currentVpText`/`votingPowerDisplay`, near line 350):

```tsx
// A recipient is anyone viewing a shared draft they did not author. When there
// is no draftId (brand-new proposal) the viewer is always the author.
const isRecipient = Boolean(
  draftId &&
  sharedAuthor &&
  (!address || sharedAuthor.toLowerCase() !== address.toLowerCase()),
);
const authorAddress = sharedAuthor ?? address ?? "";
```

- [ ] **Step 3: Force recipients to Preview**

Add an effect (after the view-mode state) that locks recipients to Preview:

```tsx
useEffect(() => {
  if (isRecipient && view !== "preview") {
    void setView("preview");
  }
}, [isRecipient, view, setView]);
```

- [ ] **Step 4: Compute the recipient helper copy**

Near the role derivation, add:

```tsx
const thresholdDisplay = thresholdFormatted
  ? formatNumberUserReadable(Number(thresholdFormatted), 0)
  : "—";

const recipientState: "eligible" | "disconnected" | "below-threshold" = !address
  ? "disconnected"
  : vp.votingPower < threshold
    ? "below-threshold"
    : "eligible";

const previewHelperCopy = isRecipient
  ? draftPreviewCopy(
      recipientState === "below-threshold"
        ? {
            role: "recipient",
            state: "below-threshold",
            thresholdDisplay,
            vpDisplay: votingPowerDisplay,
            tokenSymbol: daoIdEnum,
          }
        : { role: "recipient", state: recipientState },
    )
  : draftPreviewCopy({ role: "author" });
```

- [ ] **Step 5: Fix the copy-link toast text**

In `handleShare` (lines 208-216), change the success toast to match Figma `3179:91125`:

```tsx
showCustomToast("URL copied to clipboard", "success");
```

- [ ] **Step 6: Add the fork-on-edit handler**

Add after `handleShare`:

```tsx
const handleForkEdit = async () => {
  if (!address) {
    openConnectModal?.();
    return;
  }
  try {
    const newId = await drafts.saveDraft({
      daoId,
      title: values.title,
      discussionUrl: values.discussionUrl ?? "",
      body: values.body,
      actions: values.actions,
    });
    if (!newId) {
      showCustomToast("Could not create your copy", "error");
      return;
    }
    router.push(`${basePath}/proposals/new?draftId=${newId}&view=editor`);
  } catch {
    showCustomToast("Could not create your copy", "error");
  }
};
```

- [ ] **Step 7: Add a recipient-aware Publish handler**

Recipients must connect first. Wrap the existing publish click:

```tsx
const handlePreviewPublish = () => {
  if (!address) {
    openConnectModal?.();
    return;
  }
  handlePublishClick();
};
```

- [ ] **Step 8: Render the top-bar toggle**

Inside the desktop top bar (the `!isWhitelabelRoute` block, lines 378-405), add the toggle centered in the bar. Replace the inner flex container so it has three regions (breadcrumb left, toggle center, VP/connect right). Insert, between the breadcrumb `div` (lines 381-392) and the VP `div` (lines 393-402):

```tsx
<DraftViewToggle
  mode={view}
  onChange={(m) => void setView(m)}
  showEditor={!isRecipient}
/>
```

For a recipient with no wallet, replace the VP block's `{address && (…)}` so it shows Connect Wallet instead (Figma `3187:1487`). Change that conditional to:

```tsx
{
  address ? (
    <div className="flex flex-col items-end">
      <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
        Your voting power
      </p>
      <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
        {votingPowerDisplay}
      </p>
    </div>
  ) : (
    <ConnectWalletCustom label="Connect Wallet" />
  );
}
```

Add the import:

```tsx
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
```

- [ ] **Step 9: Render Preview vs Editor**

Wrap the `<form>…</form>` (lines 406-475) and the footer `ProposalFormNavBar` so they render only in Editor mode, and render `DraftPreview` in Preview mode. Concretely, replace the form + nav bar region with:

```tsx
{
  view === "preview" ? (
    <DraftPreview
      daoId={daoId}
      daoIdEnum={daoIdEnum}
      title={values.title}
      discussionUrl={values.discussionUrl ?? ""}
      body={values.body}
      actions={values.actions}
      authorAddress={authorAddress}
      helperCopy={previewHelperCopy}
      secondaryAction={isRecipient ? "edit" : "copy-link"}
      onPublish={handlePreviewPublish}
      onCopyLink={handleShare}
      onEdit={handleForkEdit}
      publishDisabled={isRecipient && recipientState === "below-threshold"}
    />
  ) : (
    <>
      <form
        className="animate-page-slide-in flex min-h-screen flex-col gap-6 px-5 pb-5 pt-5"
        noValidate
      >
        {/* …existing form fields unchanged… */}
      </form>
      <ProposalFormNavBar
        filledCount={filledCount}
        totalCount={3}
        canPublish={canPublish}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublishClick}
        onShare={currentDraftId ? handleShare : undefined}
        isSavingDraft={isSavingDraft}
      />
    </>
  );
}
```

Keep the modals (`AddTransferModal` … `InsufficientVPModal`, lines 487-562) outside this conditional so Publish-related modals still mount in Preview mode (the recipient Publish flow uses `PublishModal`/`InsufficientVPModal`).

> Note: a recipient never sees the Editor tab, so the editable fields are never rendered — the draft is read-only on their device. Form state is still hydrated by the existing `draftId` effect, which is what `handlePublishClick` (via `values`) and `DraftPreview` consume.

- [ ] **Step 10: Manual verification (run the app)**

Use the `run` skill (or `pnpm dashboard dev`) and a dev wallet. Verify each Figma frame:

- Editor tab `3178:85658`: toggle present, form + footer render, progress works.
- Author Preview `3178:89621`: Draft badge, "Draft • author", title, Publish + Copy Link, body in Description tab, actions in Actions tab. Copy Link → "URL copied to clipboard" toast (`3179:91125`).
- Recipient (open a draft authored by another address): no Editor pill; Preview only.
  - Enough VP `3187:115`: Publish active + Edit; eligible copy.
  - Not connected `3187:1487`: top-right Connect Wallet; Publish opens wallet modal; Edit opens wallet modal; disconnected copy.
  - Below threshold `3187:2563`: Publish disabled + Edit; dynamic copy with real threshold/VP/symbol.
- Edit duplicates the draft under the connected wallet and lands on `…/proposals/new?draftId=<new>&view=editor` as author.

- [ ] **Step 11: Typecheck + lint**

Run: `pnpm dashboard typecheck && pnpm dashboard lint`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add apps/dashboard/features/create-proposal/components/ProposalCreationForm.tsx
git commit -m "feat(dashboard): editor/preview toggle and recipient draft flow"
```

---

## Task 10: Component test — recipient lock & states

**Files:**

- Create: `apps/dashboard/features/create-proposal/components/preview/DraftPreviewSidebar.test.tsx`

Covers the presentational contract that drives the three recipient states (the integration is verified manually in Task 9). We test `DraftPreviewSidebar` because it is pure and deterministic.

- [ ] **Step 1: Write the test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DraftPreviewSidebar } from "./DraftPreviewSidebar";

const baseProps = {
  title: "Title",
  authorAddress: "0x0000000000000000000000000000000000000001",
  helperCopy: "copy",
  onPublish: vi.fn(),
  onCopyLink: vi.fn(),
  onEdit: vi.fn(),
};

describe("DraftPreviewSidebar", () => {
  it("author sees Copy Link, not Edit", () => {
    render(<DraftPreviewSidebar {...baseProps} secondaryAction="copy-link" />);
    expect(screen.getByText("Copy Link")).toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("recipient sees Edit and can trigger fork", () => {
    const onEdit = vi.fn();
    render(
      <DraftPreviewSidebar
        {...baseProps}
        secondaryAction="edit"
        onEdit={onEdit}
      />,
    );
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("disables Publish when publishDisabled is set", () => {
    render(
      <DraftPreviewSidebar
        {...baseProps}
        secondaryAction="edit"
        publishDisabled
      />,
    );
    expect(screen.getByRole("button", { name: /publish/i })).toBeDisabled();
  });
});
```

> If `EnsAvatar` makes network/wagmi calls that break the render, mock it at the top of the file:
>
> ```tsx
> vi.mock(
>   "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar",
>   () => ({
>     EnsAvatar: () => null,
>   }),
> );
> ```

- [ ] **Step 2: Run the test**

Run: `pnpm dashboard test -- features/create-proposal/components/preview/DraftPreviewSidebar.test.tsx`
Expected: PASS.

- [ ] **Step 3: Typecheck + lint, then commit**

```bash
pnpm dashboard typecheck && pnpm dashboard lint
git add apps/dashboard/features/create-proposal/components/preview/DraftPreviewSidebar.test.tsx
git commit -m "test(dashboard): draft preview sidebar states"
```

---

## Task 11: Drafts list polish (`DraftCard`) + nav-bar label

**Files:**

- Modify: `apps/dashboard/features/create-proposal/components/drafts/DraftCard.tsx`
- Modify: `apps/dashboard/features/create-proposal/components/ProposalFormNavBar.tsx:38-41`
- Figma: `3178:89569`.

Match the drafts-row copy and make the row clickable into the Editor.

- [ ] **Step 1: Update `DraftCard` copy and add row click**

- Change the metadata line from `Updated {formatDistanceToNow(...)}` to `Draft • {formatDistanceToNow(draft.updatedAt)}`.
- Change the first button label `Share` → `Copy Link`.
- Make the row open the Editor on click while keeping the action buttons working (stop propagation on the button container).

Replace the component body:

```tsx
export const DraftCard = ({
  draft,
  onEdit,
  onDelete,
  onShare,
}: DraftCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onEdit(draft.id)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") onEdit(draft.id);
    }}
    className="border-border-default bg-surface-default rounded-base flex cursor-pointer flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-primary truncate text-sm font-medium">
          {draft.title || "Untitled draft"}
        </span>
        <BadgeStatus variant="outline">Draft</BadgeStatus>
      </div>
      <span className="text-secondary text-xs">
        Draft • {formatDistanceToNow(draft.updatedAt, { addSuffix: true })}
      </span>
    </div>
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onShare(draft.id)}
        className="flex-1 sm:flex-none"
      >
        <Link2 className="size-4" />
        Copy Link
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(draft.id)}
        className="flex-1 sm:flex-none"
      >
        <Pencil className="size-4" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(draft.id)}
        className="flex-1 sm:flex-none"
      >
        <Trash2 className="size-4" />
        Delete
      </Button>
    </div>
  </div>
);
```

- [ ] **Step 2: Update the nav-bar Copy link label**

In `ProposalFormNavBar.tsx` (lines 38-41), change the button text `Copy link` → `Copy Link`:

```tsx
<Button variant="outline" size="md" onClick={onShare}>
  <Link2 className="size-4" />
  Copy Link
</Button>
```

- [ ] **Step 3: Verify against Figma**

Compare a draft row with `3178:89569`: title + "Draft • [time]" left, Copy Link / Edit / Delete right; clicking the row (not a button) navigates into the Editor.

- [ ] **Step 4: Typecheck + lint, then commit**

```bash
pnpm dashboard typecheck && pnpm dashboard lint
git add apps/dashboard/features/create-proposal/components/drafts/DraftCard.tsx apps/dashboard/features/create-proposal/components/ProposalFormNavBar.tsx
git commit -m "feat(dashboard): polish draft rows and copy-link label"
```

---

## Task 12: Mobile pass + full verification

**Files:** none (verification + any responsive class fixes uncovered).

- Figma: mobile editor `3179:91128`.

- [ ] **Step 1: Mobile editor check**

In a narrow viewport (375px), verify (`3179:91128`): the Editor/Preview toggle is reachable in the top bar, the form is full-width, and the Save Draft / Publish footer stays fixed at the bottom. The desktop top bar is `hidden … lg:flex`; ensure the toggle is also reachable on mobile — if the toggle only lives in the desktop bar, add it to the mobile breadcrumb `nav` (lines 363-377) or a small mobile bar. Make the minimal class/markup change needed to expose the toggle on mobile; do not redesign the form.

- [ ] **Step 2: Full acceptance sweep**

Walk the spec's acceptance criteria checklist against the running app (author + recipient, all three VP states, Edit fork, Copy Link toast, My Drafts row click). Fix any gap in the smallest task-appropriate way.

- [ ] **Step 3: Full package checks**

```bash
pnpm dashboard typecheck
pnpm dashboard lint
pnpm dashboard test
```

Expected: all PASS.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(dashboard): mobile toggle and acceptance polish for shared drafts"
```

---

## Task 13: Changeset

**Files:**

- Create: `.changeset/<generated>.md`

- [ ] **Step 1: Add a changeset**

Run from the repo root:

```bash
pnpm changeset
```

Select **`@anticapture/dashboard`**, bump **minor**, summary:

> Shareable proposal drafts: Editor/Preview toggle, read-only draft preview, and a recipient flow to publish or fork-edit a shared draft.

No API/contract files changed, so no `@anticapture/gateful` or `@anticapture/client` changeset is required.

- [ ] **Step 2: Commit**

```bash
git add .changeset
git commit -m "chore: changeset for shareable proposal drafts"
```

---

## Notes for the implementer

- **Don't rebuild the backend or the draft fetch** — `getDraftProposal(id)`, role detection, the publish flow, and threshold/VP hooks already exist.
- **`pnpm dashboard test` runner:** confirm the exact invocation at Task 1; if `-- <path>` filtering isn't supported, use the package's documented test filter (see the `testing` skill).
- **Pixel-perfect:** the component code here is structurally correct but Tailwind values are best-effort; the per-task "Verify against Figma" steps are where you match exact spacing/typography/tokens to the referenced node ids. Use the Figma screenshots already captured (or re-pull via the Figma MCP) and the design-system tokens (`anticapture-design-system` skill) rather than hardcoding hex values.
- **No `any`/`unknown` casts** beyond the one already-justified `actions` cast in `toDraft` (project rule).
