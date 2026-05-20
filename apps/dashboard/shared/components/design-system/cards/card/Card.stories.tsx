import type { Meta, StoryObj } from "@storybook/nextjs";

import { Card } from "@/shared/components/design-system/cards/card/Card";
import type { CardProps } from "@/shared/components/design-system/cards/card/Card";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<CardProps> = {
  title: "Data Display/Cards/Card",
  component: Card,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("2753-61663"),
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<CardProps>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-4">
        <p className="text-primary text-sm font-medium">Card content</p>
        <p className="text-secondary text-sm">
          A non-clickable container for display-only content.
        </p>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};
