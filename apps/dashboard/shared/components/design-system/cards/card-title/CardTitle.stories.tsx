import type { Meta, StoryObj } from "@storybook/nextjs";

import { BadgeStatus } from "@/shared/components/design-system/badges/badge-status/BadgeStatus";
import { CardTitle } from "@/shared/components/design-system/cards/card-title/CardTitle";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Data Display/Cards/CardTitle",
  component: CardTitle,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("11222-40214"),
  },
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: "text",
      description: "Title text content",
    },
    isSmall: {
      control: "boolean",
      description: "Use smaller 14px size instead of 18px",
    },
    hasIcon: {
      control: "boolean",
      description: "Show check-circle icon before the text",
    },
    avatar: {
      control: false,
      description: "Avatar node rendered before text",
    },
    badge: {
      control: false,
      description: "Badge node rendered after text",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof CardTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: "Card Title",
    isSmall: false,
    hasIcon: false,
  },
};

export const AllStates: Story = {
  args: { text: "Card Title" },
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-secondary px-1 text-xs">
          Large (isSmall=false)
        </span>
        <div className="flex flex-col gap-3">
          <CardTitle text="Card Title" />
          <CardTitle text="Card Title" hasIcon />
          <CardTitle
            text="Card Title"
            avatar={<div className="bg-surface-contrast size-6 rounded-full" />}
          />
          <CardTitle
            text="Card Title"
            badge={<BadgeStatus variant="secondary">Badge</BadgeStatus>}
          />
          <CardTitle
            text="Card Title"
            avatar={<div className="bg-surface-contrast size-6 rounded-full" />}
            badge={<BadgeStatus variant="secondary">Badge</BadgeStatus>}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-secondary px-1 text-xs">
          Small (isSmall=true)
        </span>
        <div className="flex flex-col gap-3">
          <CardTitle text="Card Title" isSmall />
          <CardTitle text="Card Title" isSmall hasIcon />
          <CardTitle
            text="Card Title"
            isSmall
            avatar={<div className="bg-surface-contrast size-5 rounded-full" />}
          />
          <CardTitle
            text="Card Title"
            isSmall
            badge={<BadgeStatus variant="secondary">Badge</BadgeStatus>}
          />
          <CardTitle
            text="Card Title"
            isSmall
            avatar={<div className="bg-surface-contrast size-5 rounded-full" />}
            badge={<BadgeStatus variant="secondary">Badge</BadgeStatus>}
          />
        </div>
      </div>
    </div>
  ),
};
