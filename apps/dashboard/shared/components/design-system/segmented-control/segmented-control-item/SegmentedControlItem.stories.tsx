import type { Meta, StoryObj } from "@storybook/nextjs";

import { SegmentedControlItem } from "@/shared/components/design-system/segmented-control/segmented-control-item/SegmentedControlItem";
import type { SegmentedControlItemProps } from "@/shared/components/design-system/segmented-control/types";

type SegmentedControlItemStoryArgs = SegmentedControlItemProps & {
  showBadge?: boolean;
};

const meta: Meta<SegmentedControlItemStoryArgs> = {
  title: "Design System/Segmented Control/SegmentedControlItem",
  component: SegmentedControlItem,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=6-205",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Item label text",
    },
    isActive: {
      control: "boolean",
      description: "Whether this item is currently selected",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size variant — sm (12px) or md (14px)",
    },
    items: {
      control: "text",
      description: "Optional badge text displayed next to the label",
    },
    showBadge: {
      control: "boolean",
      description: "Toggle badge on all states",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<SegmentedControlItemStoryArgs>;

export const Default: Story = {
  args: {
    label: "Overview",
    isActive: false,
    size: "md",
  },
};

export const AllStates: Story = {
  args: {
    showBadge: false,
  },
  render: ({ showBadge }) => {
    const badge = showBadge ? "12" : undefined;

    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <SegmentedControlItem
            label="Overview"
            isActive={false}
            items={badge}
          />
          <span className="text-secondary text-xs">Inactive</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SegmentedControlItem
            label="Delegates"
            isActive={true}
            items={badge}
          />
          <span className="text-secondary text-xs">Active</span>
        </div>
      </div>
    );
  },
} satisfies Story;

export const Sizes: Story = {
  args: {
    showBadge: false,
  },
  render: ({ showBadge }) => {
    const badge = showBadge ? "12" : undefined;

    return (
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <SegmentedControlItem
              label="Overview"
              size="sm"
              isActive={true}
              items={badge}
            />
            <SegmentedControlItem
              label="Delegates"
              size="sm"
              isActive={false}
              items={badge}
            />
          </div>
          <span className="text-secondary text-xs">SM — 12px</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <SegmentedControlItem
              label="Overview"
              size="md"
              isActive={true}
              items={badge}
            />
            <SegmentedControlItem
              label="Delegates"
              size="md"
              isActive={false}
              items={badge}
            />
          </div>
          <span className="text-secondary text-xs">MD — 14px</span>
        </div>
      </div>
    );
  },
} satisfies Story;
