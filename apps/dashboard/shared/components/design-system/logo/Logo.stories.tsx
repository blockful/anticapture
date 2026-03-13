import type { Meta, StoryObj } from "@storybook/nextjs";

import { Logo } from "@/shared/components/design-system/logo/Logo";
import type {
  LogoSize,
  LogoVariant,
} from "@/shared/components/design-system/logo/Logo";

const meta = {
  title: "Design System/Primitives/Logo",
  component: Logo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "brand",
        "default",
        "inverted",
        "monochrome",
      ] satisfies LogoVariant[],
      description: "Color treatment of the logo",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"] satisfies LogoSize[],
      description: "Size of the logo",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "brand",
    size: "md",
  },
};

export const Brand: Story = {
  args: {
    variant: "brand",
    size: "lg",
  },
};

export const DefaultVariant: Story = {
  args: {
    variant: "default",
    size: "lg",
  },
};

export const Inverted: Story = {
  name: "Inverted (use on dark backgrounds)",
  args: {
    variant: "inverted",
    size: "lg",
  },
  decorators: [
    (Story) => (
      <div className="bg-surface-action rounded-md p-6">
        <Story />
      </div>
    ),
  ],
};

export const Monochrome: Story = {
  args: {
    variant: "monochrome",
    size: "lg",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-secondary mb-3 text-xs font-medium uppercase tracking-wider">
          Color Variants
        </p>
        <div className="flex flex-wrap items-center gap-8">
          {(["brand", "default", "monochrome"] as LogoVariant[]).map(
            (variant) => (
              <div key={variant} className="flex flex-col items-center gap-2">
                <Logo variant={variant} size="lg" />
                <span className="text-secondary font-mono text-xs capitalize">
                  {variant}
                </span>
              </div>
            ),
          )}
          <div className="flex flex-col items-center gap-2">
            <div className="bg-surface-action rounded-md p-3">
              <Logo variant="inverted" size="lg" />
            </div>
            <span className="text-secondary font-mono text-xs">inverted</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-secondary mb-3 text-xs font-medium uppercase tracking-wider">
          Size Scale
        </p>
        <div className="flex flex-wrap items-end gap-8">
          {(["sm", "md", "lg", "xl"] as LogoSize[]).map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Logo variant="brand" size={size} />
              <span className="text-secondary font-mono text-xs">{size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const UsageConstraints: Story = {
  name: "Usage Constraints",
  render: () => (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <p className="text-primary mb-1 text-sm font-medium">Do</p>
        <ul className="text-secondary flex flex-col gap-1 text-sm">
          <li>• Use brand variant on light or neutral backgrounds</li>
          <li>• Use inverted variant on dark or brand-colored backgrounds</li>
          <li>• Maintain minimum size of sm (24px) for legibility</li>
          <li>• Preserve aspect ratio — never stretch or squish</li>
        </ul>
      </div>
      <div>
        <p className="text-error mb-1 text-sm font-medium">Don&apos;t</p>
        <ul className="text-secondary flex flex-col gap-1 text-sm">
          <li>• Don&apos;t use on busy or low-contrast backgrounds</li>
          <li>• Don&apos;t recolor outside of the defined variants</li>
          <li>• Don&apos;t rotate or apply effects</li>
          <li>• Don&apos;t use below 24px</li>
        </ul>
      </div>
    </div>
  ),
};
