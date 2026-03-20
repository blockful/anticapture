import type { Meta, StoryObj } from "@storybook/nextjs";

import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import type { SegmentedControlProps } from "@/shared/components/design-system/segmented-control/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

type SegmentedControlStoryArgs = SegmentedControlProps & {
  showBadges?: boolean;
};

const meta: Meta<SegmentedControlStoryArgs> = {
  title: "Data Entry/Segmented Control/SegmentedControl",
  component: SegmentedControl,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("6492-10373"),
  },
  tags: ["autodocs"],
  argTypes: {
    items: {
      control: "object",
      description: "Array of items with label, value, and optional badge",
    },
    value: {
      control: "text",
      description: "Value of the currently selected item",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size variant propagated to all items",
    },
    showBadges: {
      control: "boolean",
      description: "Toggle badges on all items",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<SegmentedControlStoryArgs>;

export const Default: Story = {
  args: {
    items: [
      { label: "Overview", value: "overview" },
      { label: "Delegates", value: "delegates" },
      { label: "Proposals", value: "proposals" },
    ],
    value: "overview",
    size: "md",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">SM — 12px</span>
        <SegmentedControl
          size="sm"
          items={[
            { label: "Overview", value: "overview" },
            { label: "Delegates", value: "delegates" },
            { label: "Proposals", value: "proposals" },
          ]}
          value="overview"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">MD — 14px</span>
        <SegmentedControl
          size="md"
          items={[
            { label: "Overview", value: "overview" },
            { label: "Delegates", value: "delegates" },
            { label: "Proposals", value: "proposals" },
          ]}
          value="overview"
        />
      </div>
    </div>
  ),
};

export const ItemCounts: Story = {
  args: {
    showBadges: false,
  },
  render: ({ showBadges }) => {
    const badge = showBadges ? "12" : undefined;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-secondary text-xs">2 items</span>
          <SegmentedControl
            items={[
              { label: "Overview", value: "overview", items: badge },
              { label: "Activity", value: "activity", items: badge },
            ]}
            value="overview"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-secondary text-xs">3 items</span>
          <SegmentedControl
            items={[
              { label: "Overview", value: "overview", items: badge },
              { label: "Delegates", value: "delegates", items: badge },
              { label: "Proposals", value: "proposals", items: badge },
            ]}
            value="overview"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-secondary text-xs">4 items</span>
          <SegmentedControl
            items={[
              { label: "Overview", value: "overview", items: badge },
              { label: "Delegates", value: "delegates", items: badge },
              { label: "Proposals", value: "proposals", items: badge },
              { label: "Activity", value: "activity", items: badge },
            ]}
            value="overview"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-secondary text-xs">5 items</span>
          <SegmentedControl
            items={[
              { label: "Overview", value: "overview", items: badge },
              { label: "Delegates", value: "delegates", items: badge },
              { label: "Proposals", value: "proposals", items: badge },
              { label: "Activity", value: "activity", items: badge },
              { label: "Analytics", value: "analytics", items: badge },
            ]}
            value="overview"
          />
        </div>
      </div>
    );
  },
} satisfies Story;
