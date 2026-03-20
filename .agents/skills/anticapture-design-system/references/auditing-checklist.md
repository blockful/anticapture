# Auditing Checklist

Use this checklist when **updating an existing** design system component. Always audit the full component against current Figma specs before making the requested change.

## Pre-Change Audit

### 1. Fetch Current Figma Specs

- [ ] Use `mcp__figma__get_design_context` to get the latest component spec
- [ ] Use `mcp__figma__get_screenshot` to capture the current visual reference
- [ ] Use `mcp__figma__get_variable_defs` to get current token definitions

### 2. Read Existing Code

- [ ] Read the component file (`.tsx`)
- [ ] Read the story file (`.stories.tsx`)
- [ ] Read shared types (`types.ts`) and styles (`styles.ts`) if they exist
- [ ] Read the `index.ts` re-export if present
- [ ] Check for other components that import from the same shared types/styles

### 3. Audit Folder Structure

Before touching any code, verify the component follows the hierarchy rule:

- [ ] **Root composite** (`Component.tsx`) has `.stories.tsx` + `.figma.tsx` alongside it
- [ ] **Sub-parts that are named Figma components** live in their own `component-name/` subfolder with `.stories.tsx` + `.figma.tsx`
- [ ] **Internal building blocks** (only used by one parent, no independent Figma frame) are flat `.tsx` files inside the parent subfolder — no own subfolder, no stories, no figma
- [ ] **`index.ts`** uses explicit named exports (`export { X }`, `export type { Y }`) — never `export *`
- [ ] **`types.ts`** exists for shared prop types; inline prop types only acceptable when tied to a CVA variant object
- [ ] **`cn()`** imported from `@/shared/utils/cn` (not `@/shared/utils`)
- [ ] **No imports from `@/shared/components`** inside design-system components — use direct source paths to avoid circular deps
- [ ] Component belongs in the correct category (`RadioButton` → `form/fields/`, not `buttons/`)

### 4. Diff: Code vs Figma

Compare what the code currently implements against what Figma defines:

- [ ] **Variants** — Does the code have all variants that Figma defines? Any extra?
- [ ] **Sizes** — Does the code have all sizes that Figma defines?
- [ ] **States** — Are all states implemented? (default, hover, active, focus, disabled, error, loading)
- [ ] **Token usage** — Are all color/spacing values using semantic tokens, or are some hardcoded?
- [ ] **Props** — Does the component expose all configurable properties from Figma?
- [ ] **Stories** — Does every variant/size/state have a corresponding story?
- [ ] **Figma link** — Does the story have a `getFigmaDesignConfigByNodeId` call? Is the node ID current?

### 4. Identify Gaps

List everything that needs fixing, separated into:

- **Drift** — Values that don't match Figma (wrong color, wrong spacing, wrong border-radius)
- **Missing** — Variants/states/props defined in Figma but not implemented
- **Hardcoded** — Raw hex/px values that should use tokens
- **Story gaps** — Missing stories for existing or new variants

## During Change

### Fix What You Find

Even if the user only asked for one specific change:

- [ ] Replace hardcoded values with semantic tokens
- [ ] Add missing variants and states that Figma defines
- [ ] Update token values that have drifted from Figma
- [ ] Add missing stories for uncovered variants/states
- [ ] Update the Figma node ID if it has changed

### Protect Existing Behavior

- [ ] Do **not** remove existing props or variants without explicit user instruction (breaking change)
- [ ] If shared `types.ts` or `styles.ts` files change, verify all sibling components that import them still compile
- [ ] If a token value is corrected, check other components that use the same token

### Document What Changed

Leave a brief summary in your response to the user:

- What was **requested** (the original ask)
- What was **corrected** (drift/hardcoded fixes found during audit)
- What was **added** (missing variants/states)

## Post-Change Verification

- [ ] `pnpm dashboard typecheck` passes
- [ ] `pnpm dashboard lint` passes
- [ ] All existing stories still render without errors
- [ ] New/changed stories match the Figma screenshot
- [ ] No broken imports in sibling components
- [ ] Figma embed loads in the Storybook design panel
