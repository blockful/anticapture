import type { Meta, StoryObj } from "@storybook/nextjs";

import { ColorPalette } from "@/shared/components/design-system/colors/ColorPalette";

const meta = {
  title: "Design System/Primitives/Colors",
  component: ColorPalette,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllColors: Story = {
  name: "Color System",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-primary text-h3 font-semibold">Color System</h1>
        <p className="text-secondary text-body-md mt-2">
          All semantic color tokens. Use Tailwind classes (e.g.{" "}
          <code className="bg-surface-contrast rounded px-1 text-xs">
            text-primary
          </code>
          ,{" "}
          <code className="bg-surface-contrast rounded px-1 text-xs">
            bg-surface-default
          </code>
          ) — never raw hex or CSS variables in components.
        </p>
      </div>
      <ColorPalette />
    </div>
  ),
};

export const TokenNaming: Story = {
  name: "Token Naming Structure",
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-primary text-h4 mb-6 font-semibold">
        Token Naming Structure
      </h2>
      <div className="flex flex-col gap-4">
        {[
          {
            tier: "Tier 1 — Base",
            example: "--base-brand: #ec762e",
            desc: "Raw values. Never used in components.",
            className: "border-border-contrast bg-surface-contrast",
          },
          {
            tier: "Tier 2 — Semantic",
            example: "--color-highlight: var(--base-brand)",
            desc: "Purpose-driven aliases. Auto-generates Tailwind classes.",
            className: "border-border-contrast bg-surface-contrast",
          },
          {
            tier: "Tier 3 — Tailwind",
            example: "text-highlight, bg-surface-default",
            desc: "What components use. Generated from Tier 2.",
            className: "border-border-contrast bg-surface-contrast",
          },
        ].map(({ tier, example, desc, className }) => (
          <div key={tier} className={`rounded-lg border p-4 ${className}`}>
            <p className="text-primary text-sm font-semibold">{tier}</p>
            <code className="text-highlight mt-1 block font-mono text-xs">
              {example}
            </code>
            <p className="text-secondary mt-1 text-xs">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};
