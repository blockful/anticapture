# Shareable Proposal Drafts — Editor/Preview + Recipient View

- **Task:** DEV-932 (ClickUp `86aj6k7wa`) — "shareable proposal drafts (governance front-end)"
- **PRD:** ClickUp `86aj67gq6`
- **Figma:** file `mUgy2KpQ3gJ07yZaUaXu8l`, Section `🗳️ Governance Front-end - Updates` (node `3142:79130`), Page `↳ 👩‍💻 WIP`
- **Branch:** `feat/preview-drafts`
- **Package:** `apps/dashboard`
- **Goal:** pixel-perfect implementation of the Figma frames.

## Problem

Proposal drafts must be shareable: an author drafts a proposal, shares a link, and a
recipient (e.g. `avsa` for the security-council proposal) either **publishes it on-chain**
or **exports it as JSON** to recreate it. The shared view is a **read-only preview that
looks like a published proposal**, not the filled creation form.

## Decisions (locked)

1. **Transport — Option B (server-side persistence).** Already chosen and built on this
   branch. Drafts persist via `apps/api` `proposal-drafts` CRUD; sharing uses the public
   `GET /proposal-drafts/{id}` endpoint. We do **not** encode drafts in the URL.
2. **Preview render — reuse the published layout.** Reuse `TabsSection`
   (`DescriptionTabContent` + `ActionsTabContent`) via a draft→`ProposalViewData` adapter,
   paired with a new draft-specific left sidebar. We do **not** render the full
   voting-coupled `ProposalSection` shell with everything flagged off.
3. **Threshold copy — dynamic from chain.** Render real threshold + token symbol +
   recipient VP, not the Figma placeholders.
4. **Scope — one PR** covering the full spec below.

## Already implemented on the branch (build on, do not rebuild)

- **Backend:** `apps/api/src/controllers/draft-proposals/index.ts` — full CRUD with
  author-gated `POST/PUT/DELETE` and a **public** `GET /proposal-drafts/{id}` whose
  response includes `author`.
- **Client SDK:** `@anticapture/client` exposes `getDraftProposal` (by id),
  `getDraftProposals` (by address), `createDraftProposal`, `updateDraftProposal`,
  `deleteDraftProposal`.
- **Dashboard:**
  - `features/create-proposal/hooks/useDrafts.ts` — API-backed list with localStorage→API
    migration.
  - `features/create-proposal/components/ProposalCreationForm.tsx` — loads a shared draft
    by `?draftId`, and **already distinguishes author vs recipient** via
    `shared.author.toLowerCase() === address?.toLowerCase()` (author → `currentDraftId` set;
    recipient → `currentDraftId` undefined).
  - `features/create-proposal/components/ProposalFormNavBar.tsx` — sticky footer with
    Copy link / Save Draft / Publish + progress bar.
  - `features/create-proposal/hooks/useProposalThreshold.ts`,
    `useProposalVotingPower.ts`, `usePublishProposal.ts` and the publish modals.
  - `features/create-proposal/components/drafts/DraftCard.tsx` + "My Drafts" tab in
    `features/governance/components/governance-overview/GovernanceSection.tsx`.

## Remaining work (this task)

### 1. View shell & Editor/Preview toggle

`ProposalCreationForm` becomes the **draft view shell** with a top bar hosting a segmented
**Editor / Preview** control (Figma `3178:85658`; mobile `3179:91128`).

- View mode persisted in a `?view=editor|preview` query param via `nuqs`
  (`parseAsStringEnum`, default `editor`), matching the existing `tab`/`activeTab` pattern.
- **Author** (new draft or `shared.author === address`): both tabs shown.
- **Recipient** (`draftId` present and `shared.author !== address`): the **Editor tab is
  removed** and the view is locked to Preview. The editable form is **not mounted** for a
  recipient, so the draft is read-only by construction (and the backend already rejects
  non-author writes).
- The `«` sidebar-collapse and the wallet/VP chip in the Figma top bar are the existing
  global app header. Only the Editor/Preview toggle and the recipient `Connect Wallet`
  affordance are new in this view.

### 2. Preview render (read-only, badged "Draft")

Figma `3178:89621` (author) and recipient frames `3187:115` / `3187:1487` / `3187:2563`.

- **Right column — reuse published rendering.** Add a `variant: "draft"` path that adapts
  the in-memory draft into `ProposalViewData` (mirroring the `adaptedOffchainProposal`
  block in `ProposalSection.tsx`: zeroed votes/quorum, null timestamps) and renders
  `TabsSection` with **Description + Actions tabs only**. The Votes tab is gated out;
  `ProposalInfoSection`, `ProposalStatusSection`, header voting buttons, and the voting
  modals are not rendered.
- **Actions tab.** Encode the draft's structured `ProposalAction[]` into
  `{ targets, values, calldatas }` via the existing
  `features/create-proposal/utils/encodeActions.ts`, so `ActionsTabContent` renders
  identically to a published proposal's decoded actions.
- **Left column — new draft sidebar** (not the published `TitleSection`): a "Draft" badge,
  the **"Draft • [author]"** line (always the original author from `shared.author`, even
  when a different wallet is connected), the proposal title, the action buttons (Section 3),
  and the helper copy.

### 3. Author vs recipient actions (left sidebar)

| Viewer                                             | Buttons                                                                                              | Helper copy                                                                                                                                                                                |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Author (Preview)                                   | **Publish** + **Copy Link**                                                                          | "This draft hasn't been submitted on-chain yet. Share the link so someone can review it, or submit it for you."                                                                            |
| Recipient, connected, VP ≥ threshold (`3187:115`)  | **Publish** (active) + **Export JSON**                                                               | "This draft was shared with you. Review it, then publish it on-chain. You can also export the JSON to recreate it yourself."                                                               |
| Recipient, not connected (`3187:1487`)             | **Publish** (opens wallet modal, then submits) + **Export JSON**; top-right shows **Connect Wallet** | "This draft was shared with you. Connect your wallet to publish it on-chain, or export the JSON to recreate it yourself."                                                                  |
| Recipient, connected, VP < threshold (`3187:2563`) | **Publish** disabled + **Export JSON**                                                               | **Dynamic**: "You need {threshold} {symbol} to submit a proposal. This wallet holds {vp}. Ask someone with enough voting power to publish it, or export the JSON to recreate it yourself." |

- Threshold + symbol come from `useProposalThreshold` (`thresholdFormatted`) and DAO config;
  recipient VP from `useProposalVotingPower`.
- Publish reuses `usePublishProposal` + `PublishModal` / `InsufficientVPModal`. When not
  connected, Publish triggers `openConnectModal` (RainbowKit `useConnectModal`) before
  submitting.

### 4. Export / Import JSON (net new)

- **`exportDraftJson(draft)`** util — serializes `{ schemaVersion, title, discussionUrl,
body, actions }` and triggers a browser file download (e.g. `draft-<title-slug>.json`).
  Surfaced on the recipient Preview and as a "fork" path.
- **`importDraftJson(file)`** util + a file-picker affordance on the Editor (creation form).
  Parses and validates the file against a zod schema derived from `ProposalFormSchema`. On
  success, hydrate a new **local draft owned by the importer** (then editable/publishable
  subject to normal threshold/VP checks on submit). On an invalid file, show an inline
  error toast. (No-backend path to "edit & submit someone else's draft.")

### 5. Pixel/copy polish (acceptance criteria)

- Copy-link toast text → **"URL copied to clipboard"** (`3179:91125`), replacing the
  current "Share link copied".
- `DraftCard`: button "Share" → **"Copy Link"**; metadata "Updated X ago" →
  **"Draft • [time]"**; **row click opens the Editor tab** (currently only the buttons act).
- `ProposalFormNavBar`: "Copy link" → "Copy Link".
- Drafts list matches Figma `3178:89569` (All Proposals / My Drafts tabs, Copy Link / Edit /
  Delete row actions).

### 6. Mobile

Editor is responsive (`3179:91128`): Editor/Preview toggle in the top bar, full-width form,
existing fixed Save Draft / Publish footer. A dedicated mobile recipient preview is **not**
required.

## Components & boundaries

- **`ProposalCreationForm` (shell):** owns view-mode state, author/recipient role, and
  renders either the Editor (existing form) or the Preview.
- **Draft Preview (new):** left sidebar (draft-specific) + right column (`TabsSection` in
  `variant="draft"`). Pure function of the draft + viewer role; no on-chain proposal fetch.
- **draft→`ProposalViewData` adapter (new util):** isolates the shape mapping; unit-tested.
- **`exportDraftJson` / `importDraftJson` (new utils):** isolated, unit-tested round-trip.
- **`TabsSection` / `DescriptionTabContent` / `ActionsTabContent`:** extended to accept the
  draft variant (Votes tab gated out); otherwise unchanged for published proposals.

## Out of scope

- No redesign of the creation form fields/layout.
- No collaborative/multi-author editing, comments, or versioning.
- Recipient does not edit the shared draft in place (read-only); they export JSON to take
  ownership.
- No backend changes (CRUD + public get-by-id already exist).

## Error handling

- Shared draft fails to load → "Could not load the shared draft" toast (already present).
- Import: invalid/malformed JSON → inline error toast; no partial hydration.
- Publish errors reuse the existing `SubmissionFailedModal` flow.

## Testing

- **Unit:** `exportDraftJson`/`importDraftJson` round-trip and invalid-file handling; the
  draft→`ProposalViewData` adapter; dynamic threshold-copy formatting.
- **Component:** Editor/Preview toggle; recipient lock (Editor tab absent, form unmounted);
  the three recipient VP states (active / wallet-modal / disabled); Copy Link toast.
- Follow existing dashboard test conventions (`testing` skill).

## Acceptance criteria (from PRD)

- [ ] "My Drafts" tab lists drafts with Copy Link / Edit / Delete; row click opens Editor.
- [ ] Editor / Preview toggle switches between the form and a read-only render badged
      "Draft" (no votes/results/timeline).
- [ ] Copy Link (Preview tab + draft rows) copies a shareable link and shows the
      "URL copied to clipboard" toast.
- [ ] Opening a shared link shows Preview only; Editor tab absent; not editable by recipient.
- [ ] "Draft • [author]" shows the original author even when a different wallet is connected.
- [ ] Connected recipient with enough VP can Publish on-chain.
- [ ] Not-connected recipient: Publish opens the wallet connection modal before submitting.
- [ ] Below-threshold recipient: Publish disabled, copy explains the requirement.
- [ ] Export JSON downloads the draft as JSON; Import JSON on the creation form recreates a
      local draft (subject to normal threshold / VP checks on submit).

## Changeset

Add a `@anticapture/dashboard` changeset (minor — new user-facing feature). No API/contract
changes, so no `@anticapture/gateful` or `@anticapture/client` changeset required.
