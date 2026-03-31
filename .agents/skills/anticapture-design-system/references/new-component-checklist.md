# New Component Checklist

Step-by-step process for creating a new design system component from Figma.

---

## 0. Read Guidelines First

Before writing any code or fetching from Figma, read all relevant skill files:

- [ ] `.agents/skills/anticapture-design-system/SKILL.md` — workflow, guardrails, key paths, commands
- [ ] `.agents/skills/anticapture-design-system/references/component-anatomy.md` — file structure templates, `cn()` class order, Radix pattern, story template
- [ ] `.agents/skills/anticapture-design-system/references/design-tokens.md` — token architecture, all token categories, rules for adding new tokens
- [ ] `.agents/skills/anticapture-design-system/references/figma-workflow.md` — Figma MCP extraction steps, token mapping table, verification phase
- [ ] `.agents/skills/anticapture-dashboard/SKILL.md` — parent skill with general dashboard conventions (code style, import ordering, naming)
- [ ] `.agents/skills/anticapture-dashboard/references/code-conventions.md` — import paths, naming rules, file placement
- [ ] `.agents/skills/anticapture-dashboard/references/engineering-patterns.md` — data patterns, component patterns used across the dashboard
- [ ] Read **2–3 existing components** in the same category to understand local patterns before writing anything

---

## 1. Fetch from Figma MCP

- [ ] Run `mcp__figma__get_design_context` on the target node ID
- [ ] Run `mcp__figma__get_screenshot` for visual reference
- [ ] Record all **props** and their types (e.g. `status`, `isSmall`, `label`)
- [ ] Record all **variants** (e.g. Default, Hover, Active)
- [ ] Record all **size variants** and which prop controls them (e.g. `isSmall`)
- [ ] Record all **color tokens** used (e.g. `var(--text/secondary)`, `var(--borders/highlight)`)
- [ ] Record all **spacing tokens** (padding, gap) and their resolved px values
- [ ] Record **typography** (font size, line height, font weight)
- [ ] Note the **node ID** of the component set (for Storybook + Code Connect)

---

## 2. Map Figma Tokens to Code

- [ ] Cross-reference every Figma token against `apps/dashboard/app/globals.css`
- [ ] Map each token to its Tailwind utility class using the chain:
      `Figma token → --color-* variable → Tailwind class`

  Common mappings:
  | Figma token | Tailwind class |
  |---|---|
  | `var(--text/secondary)` | `text-secondary` |
  | `var(--text/link)` | `text-link` |
  | `var(--text/primary)` | `text-primary` |
  | `var(--borders/default)` | `border-border-default` |
  | `var(--borders/highlight)` | `border-highlight` |
  | brand color | `text-highlight` |

- [ ] If a token is missing from `globals.css`, add it following the 3-tier system (`--base-*` → `--color-*` → Tailwind class)
- [ ] **Never hardcode** hex or raw px values

---

## 3. Decide File Structure

### Check for existing design system components

Before building any sub-element from scratch, ask:

- [ ] Does this component render elements that look like other design system components (badges, buttons, icons, avatars, checkboxes)?
- [ ] If yes, search `shared/components/design-system/` for a matching component
- [ ] If a match exists, **import and use it** — never recreate it inline
- [ ] Document which design system components are composed inside this component

> Example: A Tab with a count indicator → use `<BadgeStatus>` from the badges component, not a custom `<span>` with manual styles.

| If the component is...            | Use pattern                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Standalone (one variant axis)     | `category/Component.tsx` + `Component.stories.tsx` + `Component.figma.tsx`                                                        |
| A family with shared types/styles | `category/types.ts` + `category/styles.ts` + `category/component/Component.tsx` + `Component.stories.tsx` + `Component.figma.tsx` |

### Composite vs internal sub-parts

When a component has sub-parts (e.g. a Drawer with a header and body), apply this rule:

**A sub-part gets its own named subfolder + `.stories.tsx` + `.figma.tsx` when:**

- A consumer would use it directly (it appears in the public `index.ts`)
- It exists as a named, documented component in Figma

**A sub-part is a flat file inside the composite's folder when:**

- It is only ever used by one parent composite (not re-exported publicly)
- It is purely structural — renders one specific slot of its parent
- It has no independent Figma frame

> Ask yourself: "Does this appear in Figma as its own named component?" If yes → subfolder + stories + figma. If it's just a structural slot inside a bigger component → flat file.

**Example — Drawer:**

```
drawer/
├── Drawer.tsx                 ← composite root → stories + figma
├── Drawer.stories.tsx
├── Drawer.figma.tsx
├── drawer-header/             ← composite sub-part → stories + figma
│   ├── DrawerHeader.tsx
│   ├── DrawerHeader.stories.tsx
│   ├── DrawerHeader.figma.tsx
│   ├── DrawerTitle.tsx        ← internal flat file (only used by DrawerHeader)
│   ├── DrawerSubtitle.tsx
│   ├── DrawerTabs.tsx
│   └── DrawerCloseButton.tsx
└── drawer-body/               ← composite sub-part → stories + figma
    ├── DrawerBody.tsx
    ├── DrawerBody.stories.tsx
    └── DrawerBody.figma.tsx
```

---

## 4. Create Files

### `category/types.ts`

- [ ] Export a `type ComponentSize = "sm" | "md" | ...` if sizes exist
- [ ] Export a `type ComponentVariant = ...` if variants exist
- [ ] Export `type ComponentProps` with all props (`label`, `isActive`, `size`, `className`, `onClick`, etc.)
- [ ] Use `interface extends` for native HTML attribute inheritance when wrapping a native element
- [ ] Always include `className?: string`

### `category/styles.ts` _(compound components only)_

- [ ] Export `sizeStyles: Record<ComponentSize, string>` if sizes exist
- [ ] Export `variantStyles: Record<ComponentVariant, string>` if variants exist
- [ ] All values use semantic Tailwind classes only

### `category/component/Component.tsx`

- [ ] Import types from `../types`
- [ ] Import styles from `../styles` (if compound)
- [ ] Import `cn` from `@/shared/utils/cn` (not `@/shared/utils`)
- [ ] Use `cn()` with this class order: base/layout → sizing → typography → colors → transitions → conditional states → `className`
- [ ] Set sensible defaults for all optional props
- [ ] Use `font-normal` weight unless Figma specifies otherwise
- [ ] Do **not** use `forwardRef` — declare `ref` as a regular prop (React 19)
- [ ] Use named export (`export const Component = ...`), never `export default`

### `category/index.ts`

- [ ] Re-export component and all types

---

## 5. Write Stories (`Component.stories.tsx`)

- [ ] `title: "Design System/Category/Component"`
- [ ] `design: getFigmaDesignConfigByNodeId("XXXXX-XXXXX")` — use the component **set** node ID
- [ ] `tags: ["autodocs"]`
- [ ] `argTypes` for every prop with `control`, `options`, and `description`

### Story structure (apply to every component)

- [ ] **`Default`** — always `args`-based (never `render`). All props wired to `argTypes`. Use realistic content (e.g. "Overview", "Delegates" — not "Label/Label"). This is the interactive playground.
- [ ] **`AllStates`** — one `render` story showing every state/variant side-by-side with labels. For optional boolean sub-features (icon, badge, counter): add a `showX: boolean` arg at story level instead of duplicating the grid into `VariantsWithX`.
- [ ] **`Sizes`** — one render story comparing all sizes. Only include if the component has multiple size variants.
- [ ] **`ItemCounts`** — for group/container components (TabGroup, SegmentedControl, etc.): one vertical stack from min to max item count with real labels. **Replaces** individual `TwoX`, `ThreeX`, `FourX`... stories.
- [ ] **`Disabled`** — only as a standalone story if the disabled state has significant visual impact beyond what `Default` controls can show.
- [ ] **`Interactive`** — for stateful components (Combobox, Modal): a `useState`-driven story with visible feedback.

### What NOT to create

- Never create `WithIcon` + `WithIconAndBadge` — use `AllStates` with a `showIcon: boolean` arg instead
- Never create `TwoItems`, `ThreeItems`, `FourItems` as separate stories — use `ItemCounts`
- Never create stories that are just `Default` with one arg changed (e.g. `Active`, `Selected`, `WithBadge`) — these are covered by `Default`'s controls
- [ ] Use `export default meta` (required by Storybook — the `Prefer named exports` warning is expected and acceptable in story files)

---

## 6. Write Code Connect (`Component.figma.tsx`)

- [ ] One `.figma.tsx` file **per component** (not combined)
- [ ] Connect to the **component set** node, not a single variant node
- [ ] Map Figma props to code props:
  - String props: `figma.string("propName")`
  - Enum/variant props: `figma.enum("propName", { FigmaValue: codeValue })`
  - Boolean-like props (e.g. `isSmall`): `figma.enum("isSmall", { true: "sm", false: "md" })`
- [ ] `example` must render a realistic usage of the component
- [ ] Use the full Figma file URL with `node-id=XXXXX-XXXXX` format

---

## 7. Verify

- [ ] `npx tsc --noEmit 2>&1 | grep "category/"` — zero errors in new files
- [ ] `npx eslint shared/components/design-system/category` — zero errors (warnings in story files are acceptable)
- [ ] All variants and sizes render correctly in Storybook
- [ ] Figma embed loads in the Storybook design panel
- [ ] No hardcoded hex or px values in any component file
