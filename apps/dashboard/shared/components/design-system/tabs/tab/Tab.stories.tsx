import type { Meta, StoryObj } from "@storybook/nextjs";

import { Tab } from "@/shared/components/design-system/tabs/tab/Tab";
import type { TabProps } from "@/shared/components/design-system/tabs/types";

type TabStoryArgs = TabProps & { showBadge?: boolean };

const meta: Meta<TabStoryArgs> = {
  title: "Design System/Tabs/Tab",
  component: Tab,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=7673-37546",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Tab label text",
    },
    isActive: {
      control: "boolean",
      description: "Whether this tab is currently active",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size variant — sm (12px) or md (14px)",
    },
    badge: {
      control: "text",
      description:
        "Optional badge count or label rendered after the tab label using BadgeStatus (secondary variant)",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
    showBadge: {
      control: "boolean",
      description:
        "Toggle badge visibility across all states (AllStates / Sizes stories)",
    },
  },
};

export default meta;
type Story = StoryObj<TabStoryArgs>;

export const Default: Story = {
  args: {
    label: "Overview",
    isActive: false,
    size: "sm",
    badge: undefined,
  },
};

export const AllStates: Story = {
  args: {
    showBadge: false,
  },
  render: ({ showBadge }) => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Tab
          label="Overview"
          isActive={false}
          badge={showBadge ? 3 : undefined}
        />
        <span className="text-secondary text-xs">Inactive</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Tab
          label="Overview"
          isActive={true}
          badge={showBadge ? 3 : undefined}
        />
        <span className="text-secondary text-xs">Active</span>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  args: {
    showBadge: false,
  },
  render: ({ showBadge }) => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Tab
            label="Overview"
            size="sm"
            isActive={true}
            badge={showBadge ? 3 : undefined}
          />
          <Tab
            label="Overview"
            size="sm"
            isActive={false}
            badge={showBadge ? 3 : undefined}
          />
        </div>
        <span className="text-secondary text-xs">SM — 12px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Tab
            label="Overview"
            size="md"
            isActive={true}
            badge={showBadge ? 3 : undefined}
          />
          <Tab
            label="Overview"
            size="md"
            isActive={false}
            badge={showBadge ? 3 : undefined}
          />
        </div>
        <span className="text-secondary text-xs">MD — 14px</span>
      </div>
    </div>
  ),
};
