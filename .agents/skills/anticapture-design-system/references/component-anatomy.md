# Component Anatomy

## File Naming

| Entity           | Convention                      | Example                   |
| ---------------- | ------------------------------- | ------------------------- |
| Component folder | kebab-case                      | `help-popover/`           |
| Component file   | PascalCase                      | `HelpPopover.tsx`         |
| Story file       | PascalCase + `.stories`         | `HelpPopover.stories.tsx` |
| Types file       | `types.ts` (at category level)  | `buttons/types.ts`        |
| Styles file      | `styles.ts` (at category level) | `buttons/styles.ts`       |
| Index file       | `index.ts` (re-export only)     | `button/index.ts`         |

## Simple Component Template

For standalone components (Tooltip, Divider, BlankSlate):

```tsx
import { cn } from "@/shared/utils/cn";

type ComponentNameProps = {
  variant?: "default" | "subtle";
  className?: string;
  children: React.ReactNode;
};

export const ComponentName = ({
  variant = "default",
  className,
  children,
}: ComponentNameProps) => {
  return (
    <div
      className={cn(
        // Layout
        "flex items-center gap-2",
        // Variant styles
        variant === "default" && "bg-surface-default text-primary",
        variant === "subtle" && "bg-surface-contrast text-secondary",
        // Allow overrides
        className,
      )}
    >
      {children}
    </div>
  );
};
```

## Compound Component Template

For component families (buttons, alerts, links) with shared types and styles:

### `category/types.ts`

```tsx
import type { ButtonHTMLAttributes } from "react";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  asChild?: boolean;
}
```

Key rules:

- Use `type` for union types (size, variant)
- Use `interface extends` to inherit native HTML attributes
- Always include `className?: string` for override support

### `category/styles.ts`

```tsx
import type { ButtonVariant } from "@/shared/components/design-system/buttons/types";

export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-surface-action border border-transparent text-inverted hover:bg-surface-action-hover",
  outline:
    "border border-border-contrast text-primary bg-surface-default hover:bg-surface-contrast",
  ghost:
    "bg-transparent text-primary border border-transparent hover:bg-surface-contrast",
  destructive:
    "border border-transparent bg-surface-destructive text-primary hover:bg-surface-destructive-hover",
};
```

Key rules:

- Use `Record<VariantType, string>` for variant-to-class mappings
- All class values must use semantic tokens, never raw hex
- Include hover/focus/disabled states per variant

### `category/component/Component.tsx`

```tsx
import { variantStyles } from "@/shared/components/design-system/category/styles";
import type {
  ComponentProps,
  ComponentSize,
} from "@/shared/components/design-system/category/types";
import { cn } from "@/shared/utils/cn";

const sizeStyles: Record<ComponentSize, string> = {
  sm: "py-1 px-2 text-xs",
  md: "py-2 px-4 text-sm",
  lg: "py-3 px-6 text-base",
};

export const Component = ({
  children,
  className,
  size = "md",
  variant = "primary",
  disabled = false,
  ...props
}: ComponentProps) => {
  return (
    <element
      className={cn(
        // Base styles (layout, transitions)
        "flex items-center justify-center gap-1.5 font-medium transition-colors duration-300",
        // Variant styles
        variantStyles[variant],
        // Size styles
        sizeStyles[size],
        // Disabled state
        disabled && "pointer-events-none opacity-50",
        // Allow overrides last
        className,
      )}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </element>
  );
};
```

## `cn()` Class Organization Order

When composing classes with `cn()`, follow this order:

1. **Base/layout** — `flex`, `items-center`, `gap-*`, `rounded-*`
2. **Sizing** — `py-*`, `px-*`, `h-*`, `w-*`
3. **Typography** — `text-sm`, `font-medium`, `leading-*`
4. **Colors/surfaces** — `bg-surface-*`, `text-primary`, `border-border-*`
5. **Transitions** — `transition-colors`, `duration-300`
6. **Conditional states** — `disabled && "..."`, `loading && "..."`
7. **`className` override** — Always last to allow consumer overrides

## Radix UI Integration Pattern

When wrapping Radix primitives:

```tsx
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/shared/utils/cn";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
};

export const Tooltip = ({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) => {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        side={side}
        className={cn(
          "bg-surface-action text-inverted rounded-md px-3 py-1.5 text-sm",
          className,
        )}
      >
        {content}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  );
};
```

## Story Template

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs";

import { Component } from "@/shared/components/design-system/category/component/Component";
import type { ComponentProps } from "@/shared/components/design-system/category/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<ComponentProps> = {
  title: "Design System/Category/Component",
  component: Component,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("FIGMA-NODE-ID"),
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "outline", "ghost", "destructive"],
      description: "Visual variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
    disabled: {
      control: "boolean",
      description: "Disabled state",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<ComponentProps>;

// Required stories:

export const Default: Story = {
  args: {
    variant: "primary",
    children: "Component",
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {/* One per variant with label */}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {/* One per size with label */}
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Component",
  },
};
```

Required stories for every component:

- **Default** — Primary variant, default size
- **Variants** — Grid showing all variants side-by-side with labels
- **Sizes** — Grid showing all sizes side-by-side with labels
- **Disabled** — Disabled state
- **Loading** — If the component supports a loading state
- **Component-specific states** — Any interactive or special states (e.g., WithIcon, Error, Open/Closed)

## React 19 Ref Pattern

Do **not** use `forwardRef`. Declare `ref` as a regular prop:

```tsx
type InputProps = {
  ref?: React.Ref<HTMLInputElement>;
  // ... other props
};

export const Input = ({ ref, className, ...props }: InputProps) => {
  return <input ref={ref} className={cn("...", className)} {...props} />;
};
```
