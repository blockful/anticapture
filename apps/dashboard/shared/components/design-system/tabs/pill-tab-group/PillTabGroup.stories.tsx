import type { Meta, StoryObj } from "@storybook/nextjs";

import { PillTabGroup } from "@/shared/components/design-system/tabs/pill-tab-group/PillTabGroup";
import type { PillTabGroupProps } from "@/shared/components/design-system/tabs/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<PillTabGroupProps> = {
  title: "Navigation/Tabs/PillTabGroup",
  component: PillTabGroup,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("11059-11258"),
  },
  tags: ["autodocs"],
  argTypes: {
    activeTab: {
      control: "text",
      description: "Value of the currently active tab",
    },
  },
};

export default meta;
type Story = StoryObj<PillTabGroupProps>;

export const Default: Story = {
  args: {
    tabs: [
      { label: "Proposals", value: "proposals" },
      { label: "Votes", value: "votes" },
    ],
    activeTab: "proposals",
  },
};

const allTabs = [
  { label: "Proposals", value: "proposals" },
  { label: "Votes", value: "votes" },
  { label: "Delegates", value: "delegates" },
  { label: "Treasury", value: "treasury" },
  { label: "Forums", value: "forums" },
];

export const ItemCounts: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {[2, 3, 5].map((count) => (
        <div key={count} className="flex flex-col gap-2">
          <span className="text-secondary text-xs">{count} tabs</span>
          <PillTabGroup
            tabs={allTabs.slice(0, count)}
            activeTab={allTabs[0].value}
          />
        </div>
      ))}
    </div>
  ),
};
