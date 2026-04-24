# Design Tokens

## Token Architecture

The design system uses a three-tier token system defined in `apps/dashboard/app/globals.css`:

### Tier 1 — Base Tokens (`--base-*`)

Raw values. Defined in `@theme` block for light mode and overridden in `.dark` for dark mode.

```css
/* Light (default in @theme) */
--base-primary: #18181b;
--base-background: #ffffff;
--base-brand: #ec762e;

/* Dark (override in .dark) */
--base-primary: #fafafa;
--base-background: #09090b;
--base-brand: #ec762e; /* same in both themes */
```

Components **never** reference base tokens directly.

### Tier 2 — Semantic Tokens (`--color-*`, `--size-*`, `--shadow-*`)

Purpose-driven aliases that reference base tokens. Defined in the `@theme` block.

```css
--color-primary: var(--base-primary);
--color-surface-default: var(--base-primary-foreground);
--color-border-contrast: var(--base-border);
--size-icon-sm: 24px;
--shadow-focus-ring: 0px 0px 0px 2px rgba(82, 82, 91, 0.3);
```

### Tier 3 — Tailwind Utility Classes

Tailwind CSS 4 automatically generates utility classes from `@theme` variables:

```
--color-primary       → text-primary, bg-primary
--color-surface-default → bg-surface-default
--color-border-contrast → border-border-contrast
--size-icon-sm        → (use in arbitrary values or custom classes)
```

Components consume **Tier 3** (Tailwind classes). Never use `var(--color-*)` in component code.

## Token Categories

### Text & Icon Colors

| Token                                 | Semantic Use                                  |
| ------------------------------------- | --------------------------------------------- |
| `--color-primary`                     | Default text, high emphasis                   |
| `--color-secondary`                   | Supporting text, medium emphasis              |
| `--color-dimmed`                      | Placeholder text, low emphasis                |
| `--color-inverted`                    | Text on dark surfaces (e.g., primary buttons) |
| `--color-success`                     | Success messages                              |
| `--color-warning`                     | Warning messages                              |
| `--color-error`                       | Error messages                                |
| `--color-link` / `--color-link-hover` | Interactive links                             |
| `--color-highlight`                   | Brand-accented text                           |

### Surface Colors

| Token                               | Semantic Use                      |
| ----------------------------------- | --------------------------------- |
| `--color-surface-background`        | Page background                   |
| `--color-surface-default`           | Card/panel backgrounds            |
| `--color-surface-contrast`          | Elevated or hover surfaces        |
| `--color-surface-hover`             | Explicit hover state background   |
| `--color-surface-action`            | Primary action surfaces (buttons) |
| `--color-surface-action-hover`      | Primary action hover              |
| `--color-surface-destructive`       | Destructive action surfaces       |
| `--color-surface-destructive-hover` | Destructive action hover          |
| `--color-surface-disabled`          | Disabled element backgrounds      |

### Surface Opacity Colors

| Token                             | Semantic Use              |
| --------------------------------- | ------------------------- |
| `--color-surface-opacity-success` | Subtle success background |
| `--color-surface-opacity-warning` | Subtle warning background |
| `--color-surface-opacity-error`   | Subtle error background   |
| `--color-surface-opacity-brand`   | Subtle brand background   |
| `--color-surface-opacity`         | Generic subtle background |

### Surface Solid Colors

| Token                           | Semantic Use             |
| ------------------------------- | ------------------------ |
| `--color-surface-solid-success` | Solid success background |
| `--color-surface-solid-warning` | Solid warning background |
| `--color-surface-solid-error`   | Solid error background   |
| `--color-surface-solid-brand`   | Solid brand background   |

### Border Colors

| Token                     | Semantic Use                    |
| ------------------------- | ------------------------------- |
| `--color-border-default`  | Subtle borders (dividers)       |
| `--color-border-contrast` | Visible borders (cards, inputs) |
| `--color-border-primary`  | High-emphasis borders           |
| `--color-border-error`    | Error state borders             |
| `--color-border-warning`  | Warning state borders           |
| `--color-border-success`  | Success state borders           |

### Icon Sizes

| Token             | Value | Use                   |
| ----------------- | ----- | --------------------- |
| `--size-icon-xxs` | 16px  | Inline tiny icons     |
| `--size-icon-xs`  | 20px  | Inline small icons    |
| `--size-icon-sm`  | 24px  | Default icon size     |
| `--size-icon-md`  | 36px  | Medium emphasis icons |
| `--size-icon-lg`  | 48px  | Large display icons   |
| `--size-icon-xl`  | 76px  | Hero/feature icons    |

### Other

| Token                 | Value                                   | Use                                 |
| --------------------- | --------------------------------------- | ----------------------------------- |
| `--shadow-focus-ring` | `0px 0px 0px 2px rgba(82, 82, 91, 0.3)` | Focus ring for interactive elements |
| `--radius`            | `0.625rem`                              | Default border radius               |

## Rules for Adding New Tokens

### 1. Check Before Creating

Before adding a new token, search `globals.css` for:

- An existing token with the same semantic meaning
- An existing token with the same or very similar value

If a semantically equivalent token exists, use it. Never duplicate.

### 2. Follow the Naming Hierarchy

```
--{type}-{category}-{variant}
```

Examples:

- `--color-surface-subtle` (type: color, category: surface, variant: subtle)
- `--color-border-focus` (type: color, category: border, variant: focus)
- `--size-icon-2xl` (type: size, category: icon, variant: 2xl)

### 3. Always Create Both Tiers

When adding a new token:

1. Add the **base token** (`--base-*`) with the raw value in `@theme`
2. If it differs between themes, add the dark override in `.dark`
3. Add the **semantic token** (`--color-*` or `--size-*`) referencing the base token in `@theme`

### 4. Theme Awareness

Tokens that change between light and dark must be defined in both places:

- `@theme` block (light/default values as `--base-*`)
- `.dark` block in `@layer base` (dark overrides)

Tokens that are theme-invariant (like `--base-brand: #ec762e`) only need one definition.

### 5. Never Use Raw Values in Components

```tsx
// WRONG
className = "text-[#18181b] bg-[#fafafa]";

// WRONG — referencing base token
className = "text-[var(--base-primary)]";

// CORRECT — using semantic Tailwind class
className = "text-primary bg-surface-default";
```

## Figma-to-Code Token Mapping

When Figma uses a token name, trace it through the tiers:

```
Figma "color/surface/default"
  → --color-surface-default: var(--base-primary-foreground)
    → Tailwind: bg-surface-default
```

If the Figma token name does not have a direct match in `globals.css`:

1. Check if a semantically equivalent token exists under a different name
2. If no equivalent exists, create the new token following the rules above
3. Flag the new token to the user before proceeding
