import type { Meta, StoryObj } from "@storybook/nextjs";

import { TabGroup } from "@/shared/components/design-system/tabs/tab-group/TabGroup";
import type { TabGroupProps } from "@/shared/components/design-system/tabs/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

type TabGroupStoryArgs = TabGroupProps & { showBadges?: boolean };

const meta: Meta<TabGroupStoryArgs> = {
  title: "Design System/Tabs/TabGroup",
  component: TabGroup,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("10748-16842"),
  },
  tags: ["autodocs"],
  argTypes: {
    tabs: {
      control: "object",
      description: "Array of tab items with label and value",
    },
    activeTab: {
      control: "text",
      description: "Value of the currently active tab",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size variant propagated to all tabs",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
    showBadges: {
      control: "boolean",
      description: "Toggle badge visibility across all tabs (ItemCounts story)",
    },
  },
};

export default meta;
type Story = StoryObj<TabGroupStoryArgs>;

export const Default: Story = {
  args: {
    tabs: [
      { label: "Overview", value: "overview" },
      { label: "Delegates", value: "delegates" },
      { label: "Proposals", value: "proposals" },
    ],
    activeTab: "overview",
    size: "sm",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">SM — 12px</span>
        <TabGroup
          size="sm"
          tabs={[
            { label: "Overview", value: "overview" },
            { label: "Delegates", value: "delegates" },
            { label: "Proposals", value: "proposals" },
          ]}
          activeTab="overview"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">MD — 14px</span>
        <TabGroup
          size="md"
          tabs={[
            { label: "Overview", value: "overview" },
            { label: "Delegates", value: "delegates" },
            { label: "Proposals", value: "proposals" },
          ]}
          activeTab="overview"
        />
      </div>
    </div>
  ),
};

const allLabels = [
  { label: "Overview", value: "overview" },
  { label: "Activity", value: "activity" },
  { label: "Delegates", value: "delegates" },
  { label: "Proposals", value: "proposals" },
  { label: "Analytics", value: "analytics" },
  { label: "Settings", value: "settings" },
];

export const ItemCounts: Story = {
  args: {
    showBadges: false,
  },
  render: ({ showBadges }) => (
    <div className="flex flex-col gap-6">
      {[2, 3, 4, 5, 6].map((count) => {
        const tabs = allLabels.slice(0, count).map((t) => ({
          ...t,
          badge: showBadges ? 3 : undefined,
        }));
        return (
          <div key={count} className="flex flex-col gap-2">
            <span className="text-secondary text-xs">{count} tabs</span>
            <TabGroup tabs={tabs} activeTab="overview" />
          </div>
        );
      })}
    </div>
  ),
};
