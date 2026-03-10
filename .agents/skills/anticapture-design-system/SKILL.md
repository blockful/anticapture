---
name: anticapture-design-system
description: Use when creating, updating, or auditing design system components in shared/components/design-system/. Enforces Figma-first workflow, token governance, and pixel-perfect implementation.
---

# Design System Skill

## Use This Skill When

- Creating a new component in `shared/components/design-system/`
- Updating an existing design system component
- Adding or modifying design tokens in `globals.css`
- Creating or updating `.stories.tsx` files for design system components
- Auditing a component against current Figma specs

## Parent Skill

This skill **extends `anticapture-dashboard`**. Load and follow `anticapture-dashboard` SKILL.md first for general dashboard conventions (code style, placement rules, import ordering, naming). This skill adds design-system-specific rules on top.

## Key Paths

| Path                                              | Purpose                               |
| ------------------------------------------------- | ------------------------------------- |
| `apps/dashboard/shared/components/design-system/` | Component root                        |
| `apps/dashboard/app/globals.css`                  | Design tokens (CSS custom properties) |
| `apps/dashboard/shared/utils/figma-storybook.ts`  | `getFigmaDesignConfigByNodeId` helper |
| `apps/dashboard/.storybook/main.ts`               | Storybook configuration               |
| `apps/dashboard/shared/utils/cn.ts`               | Class merging utility (`cn()`)        |

## Commands

```bash
pnpm dashboard storybook      # Start Storybook on :6006
pnpm dashboard build-storybook # Build static Storybook
pnpm dashboard typecheck       # Type checking
pnpm dashboard lint            # Lint checking
pnpm dashboard lint:fix        # Auto-fix lint issues
```

## Workflow

Follow these 6 phases in order. **Never skip a phase.**

### Phase 1 — Read Conventions

1. Load the `anticapture-dashboard` skill and read its `references/code-conventions.md` and `references/engineering-patterns.md`
2. Read all reference files from this skill (`references/`)
3. Read existing components in the same category to understand local patterns

### Phase 2 — Fetch from Figma MCP

Before writing any code, use Figma MCP tools to extract the component spec:

1. `mcp__figma__get_design_context` — Get the component design context (code hints, properties, variants)
2. `mcp__figma__get_screenshot` — Capture visual reference for pixel comparison
3. `mcp__figma__get_variable_defs` — Extract token definitions (colors, spacing, typography)
4. Record the **Figma node ID** (format: `XXXXX-XXXXX`) for Storybook linking

Extract from Figma: all variants, all states (default, hover, active, focus, disabled, error), dimensions, spacing, color tokens, typography, border radius, shadows.

**If Figma MCP is unavailable**, ask the user for specs explicitly. Never approximate from memory.

### Phase 3 — Map Tokens

1. Cross-reference every Figma token value against existing tokens in `globals.css`
2. If a semantic token exists, use the corresponding Tailwind class (e.g., `bg-surface-default`, `text-primary`)
3. If a token is missing, create it in `globals.css` following `references/design-tokens.md` rules
4. If a token value doesn't match Figma, correct it and flag the change to the user
5. **Never hardcode** hex/px values where a token should exist

### Phase 4 — Build Component

Follow the anatomy in `references/component-anatomy.md`:

1. Create the file structure (kebab-case folder, PascalCase component file)
2. Extend native HTML element attributes when wrapping a native element
3. Use `cn()` from `@/shared/utils/cn` for all class merging
4. Use Radix UI primitives for accessible interactive components
5. Use `Record<Variant, string>` pattern for variant styles
6. Implement **all** variants and states from the Figma spec, not just the obvious ones

### Phase 5 — Write Story

Every component **must** have a `.stories.tsx` file:

1. Set `title: "Design System/Category/ComponentName"` hierarchy
2. Add `design: getFigmaDesignConfigByNodeId("NODE-ID")` in `parameters`
3. Add `tags: ["autodocs"]` for auto-generated documentation
4. Add `argTypes` with controls for every prop
5. Create stories for: Default, all Variants, all Sizes, Disabled, Loading, and any component-specific interactive states

### Phase 6 — Verify

1. Run `pnpm dashboard typecheck` and `pnpm dashboard lint`
2. Compare the Storybook render against the Figma screenshot
3. Verify all variant/state combinations match the Figma spec
4. Check that the Figma embed link works in Storybook

## Component File Patterns

| Pattern  | Structure                                                                                           | When to use                                   |
| -------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Simple   | `category/Component.tsx` + `Component.stories.tsx`                                                  | Standalone: Tooltip, Divider, BlankSlate      |
| Compound | `category/variant/Variant.tsx` + `Variant.stories.tsx` + `category/types.ts` + `category/styles.ts` | Families: buttons, form fields, alerts, links |

## Guardrails

- **Never hardcode** color/spacing values that exist as tokens. Use semantic Tailwind classes (`text-primary`, `bg-surface-default`), not base variables or raw hex
- **Never create** a component without a `.stories.tsx` file
- **Never skip** the Figma MCP fetch step — every component must trace back to a Figma source
- **Never duplicate** an existing token — check `globals.css` before adding new custom properties
- **Never cast** types to `any` or `unknown`
- **Always use** arrow functions for component exports
- **Always use** named exports (never `export default` except in stories meta)
- **Always extend** native HTML element attributes when wrapping a native element
- **Always use** `cn()` from `@/shared/utils/cn` for class merging
- **Always audit** existing components fully against Figma specs before making changes (see `references/auditing-checklist.md`)
- If the same visual pattern appears in multiple components (focus ring, disabled opacity, loading state), extract it into a shared token or utility — never repeat it
- Warn the user if a requested design decision would break visual consistency with existing components
