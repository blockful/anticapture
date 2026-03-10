import type { Meta, StoryObj } from "@storybook/nextjs";
import { Shield } from "lucide-react";

import {
  IconGallery,
  IconSizeShowcase,
} from "@/shared/components/design-system/iconography/Iconography";
import type { IconSize } from "@/shared/components/design-system/iconography/Iconography";

const meta = {
  title: "Design System/Primitives/Iconography",
  component: IconGallery,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl"] satisfies IconSize[],
      description: "Icon size applied to all icons in the gallery",
    },
  },
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  name: "Icon Gallery",
  args: {
    size: "sm",
  },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-primary text-h3 font-semibold">Iconography</h1>
        <p className="text-secondary text-body-md mt-2">
          All icons use{" "}
          <a
            href="https://lucide.dev"
            className="text-link hover:text-link-hover underline"
            target="_blank"
            rel="noreferrer"
          >
            lucide-react
          </a>
          . Stroke-based, 24×24 viewBox, 1.5 stroke width at default size.
        </p>
      </div>
      <IconGallery {...args} />
    </div>
  ),
};

export const SizeScale: Story = {
  name: "Size Scale",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-primary text-h3 font-semibold">Icon Size Scale</h1>
        <p className="text-secondary text-body-md mt-2">
          Six size tiers mapped to CSS tokens. Stroke weight decreases at larger
          sizes to maintain visual balance.
        </p>
      </div>
      <IconSizeShowcase icon={Shield} />
    </div>
  ),
};

export const UsageRules: Story = {
  name: "Usage Rules",
  render: () => (
    <div className="max-w-xl">
      <h2 className="text-primary text-h4 mb-6 font-semibold">Usage Rules</h2>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-primary text-sm font-semibold">Stroke vs. Fill</p>
          <p className="text-secondary text-body-sm">
            Always use stroke icons from lucide-react. Never use filled variants
            unless the design explicitly requires it (e.g., active state
            indicators). Fill icons are reserved for selected/active states
            only.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-primary text-sm font-semibold">Alignment</p>
          <p className="text-secondary text-body-sm">
            Icons pair with text using{" "}
            <code className="bg-surface-contrast rounded px-1 text-xs">
              flex items-center gap-1.5
            </code>
            . Never use absolute positioning for text–icon pairs. Use{" "}
            <code className="bg-surface-contrast rounded px-1 text-xs">
              gap-2
            </code>{" "}
            for md+ icons.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-primary text-sm font-semibold">Color</p>
          <p className="text-secondary text-body-sm">
            Icons inherit text color via{" "}
            <code className="bg-surface-contrast rounded px-1 text-xs">
              currentColor
            </code>{" "}
            by default. Use semantic text classes (
            <code className="bg-surface-contrast rounded px-1 text-xs">
              text-secondary
            </code>
            ,{" "}
            <code className="bg-surface-contrast rounded px-1 text-xs">
              text-error
            </code>
            ) to tint icons — never raw hex.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-primary text-sm font-semibold">Accessibility</p>
          <p className="text-secondary text-body-sm">
            Decorative icons (beside visible text): add{" "}
            <code className="bg-surface-contrast rounded px-1 text-xs">
              aria-hidden=&quot;true&quot;
            </code>
            . Standalone icons (no visible text label): add{" "}
            <code className="bg-surface-contrast rounded px-1 text-xs">
              aria-label
            </code>{" "}
            or wrap in a button with a visible label for screen readers.
          </p>
        </div>
      </div>
    </div>
  ),
};
