# Figma MCP Workflow

## Before Coding — Extraction Phase

Before writing any component code, always extract the full spec from Figma:

### Step 1: Get Design Context

```
mcp__figma__get_design_context
```

Provide the component's Figma URL or node ID. This returns:

- Code hints (React + Tailwind reference)
- Component properties and variants
- Design annotations and constraints
- Code Connect snippets (if mapped)

### Step 2: Get Screenshot

```
mcp__figma__get_screenshot
```

Capture the visual reference. Use this for pixel-comparison during and after implementation.

### Step 3: Get Variable Definitions

```
mcp__figma__get_variable_defs
```

Extract token definitions: colors, spacing values, typography scales. These must be mapped to existing tokens in `globals.css`.

### Step 4: Record Node ID

Extract the Figma node ID from the URL or design context. Format: `XXXXX-XXXXX` (e.g., `10053-62143`).

This ID is required for the Storybook Figma embed.

### Step 5: Identify All Variants and States

From the Figma component set, document:

- All variant combinations (e.g., primary/outline/ghost/destructive)
- All size options (e.g., sm/md/lg)
- All interactive states: default, hover, active, focus, disabled, error
- Any responsive breakpoint variations

**If Figma MCP is unavailable**, ask the user for the complete spec. Never guess or approximate.

## During Coding — Implementation Phase

### Cross-Check Every Value

For each CSS property, verify against the Figma spec:

- `font-size`, `line-height`, `letter-spacing`, `font-weight`
- `padding`, `margin`, `gap`
- `border-radius`, `border-width`
- Colors (background, text, border)
- `box-shadow`
- `width`, `height`, `min-width`, `min-height`

### Map Figma Tokens to Code

Follow the three-tier token chain:

```
Figma token name → Semantic CSS variable → Tailwind utility class
```

Examples:
| Figma | CSS Variable | Tailwind Class |
|-------|-------------|----------------|
| surface/default | `--color-surface-default` | `bg-surface-default` |
| surface/action | `--color-surface-action` | `bg-surface-action` |
| text/primary | `--color-primary` | `text-primary` |
| text/secondary | `--color-secondary` | `text-secondary` |
| text/dimmed | `--color-dimmed` | `text-dimmed` |
| border/default | `--color-border-default` | `border-border-default` |
| border/contrast | `--color-border-contrast` | `border-border-contrast` |
| surface/destructive | `--color-surface-destructive` | `bg-surface-destructive` |
| brand | `--color-highlight` | `text-highlight` |

### Spacing Values

Use Tailwind's spacing scale. If a Figma value doesn't align with the Tailwind defaults:

1. Check if a custom token exists in `globals.css`
2. If not, use Tailwind arbitrary values (e.g., `p-[10px]`) only as a last resort
3. If the value is reused across components, create a custom token first

### Flag Ambiguities

If any Figma spec is unclear or inconsistent:

- Different states using the same color
- Missing hover/focus definitions
- Spacing values that don't follow a consistent scale
- Typography that doesn't match any defined text style

**Ask the user before making assumptions.** Never silently guess.

## After Coding — Verification Phase

### 1. Visual Comparison

Compare the Storybook render against the Figma screenshot for every variant and state. Check:

- Spacing matches (padding, margin, gap)
- Colors match (background, text, border, hover states)
- Typography matches (size, weight, line-height)
- Border radius matches
- Shadow matches

### 2. Figma Embed Verification

Confirm the Figma embed works in Storybook:

```tsx
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<typeof Component> = {
  parameters: {
    design: getFigmaDesignConfigByNodeId("XXXXX-XXXXX"),
  },
};
```

The `getFigmaDesignConfigByNodeId` function:

- Reads `FIGMA_FILE_URL` from environment to build the full URL
- Reads `FIGMA_TOKEN` server-side for API access
- Returns a `figspec` config object for the `@storybook/addon-designs` panel

### 3. Variant Coverage Check

Verify that every variant and state defined in Figma has:

- A corresponding prop value in the component types
- A style mapping in the styles file (for compound components)
- A dedicated or combined story in the `.stories.tsx` file
