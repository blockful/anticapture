import type { Meta, StoryObj } from "@storybook/nextjs";
import { PieChart } from "lucide-react";

import {
  SidebarNavItem,
  type SidebarNavItemProps,
} from "@/shared/components/design-system/navigation/sidebar-nav-item/SidebarNavItem";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<SidebarNavItemProps> = {
  title: "Navigation/Sidebar/SidebarNavItem",
  component: SidebarNavItem,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("2810-11810"),
  },
  tags: ["autodocs"],
  argTypes: {
    icon: {
      control: false,
      description: "Lucide or any icon component (ElementType)",
    },
    label: {
      control: "text",
      description: "Navigation item label",
    },
    isActive: {
      control: "boolean",
      description: "Whether the item represents the current active route",
    },
    isCollapsed: {
      control: "boolean",
      description:
        "Collapsed sidebar mode — shows icon only with optional dot indicator",
    },
    isNew: {
      control: "boolean",
      description: "Show a 'New' badge (expanded) or dot indicator (collapsed)",
    },
    href: {
      control: "text",
      description: "Navigation href — renders as a Link when provided",
    },
    onClick: {
      action: "clicked",
      description:
        "Click handler — renders as a button when no href is provided",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<SidebarNavItemProps>;

export const Default: Story = {
  args: {
    icon: PieChart,
    label: "Overview",
    isActive: false,
    isCollapsed: false,
    isNew: false,
    href: "#",
  },
  decorators: [
    (StoryFn) => (
      <div className="w-[258px]">
        <StoryFn />
      </div>
    ),
  ],
};

export const AllStates: Story = {
  args: {
    icon: PieChart,
    label: "Overview",
  },
  render: (args) => (
    <div className="flex gap-8">
      {/* Expanded states */}
      <div className="flex w-[258px] flex-col gap-2">
        <p className="text-secondary mb-1 text-xs font-medium uppercase tracking-wide">
          Expanded
        </p>
        <div className="flex flex-col gap-1">
          <SidebarNavItem {...args} isActive={false} />
          <SidebarNavItem {...args} isActive />
          <SidebarNavItem {...args} isActive={false} isNew />
          <SidebarNavItem {...args} isActive isNew />
          <div className="pointer-events-none opacity-50">
            <SidebarNavItem {...args} isActive={false} />
          </div>
        </div>
        <div className="text-secondary mt-2 flex flex-col gap-1 text-xs">
          <span>Inactive</span>
          <span>Active</span>
          <span>Inactive + New</span>
          <span>Active + New</span>
          <span>Disabled</span>
        </div>
      </div>

      {/* Collapsed states */}
      <div className="flex w-[68px] flex-col gap-2">
        <p className="text-secondary mb-1 text-xs font-medium uppercase tracking-wide">
          Collapsed
        </p>
        <div className="flex flex-col gap-1">
          <SidebarNavItem {...args} isCollapsed isActive={false} />
          <SidebarNavItem {...args} isCollapsed isActive />
          <SidebarNavItem {...args} isCollapsed isActive={false} isNew />
          <SidebarNavItem {...args} isCollapsed isActive isNew />
          <div className="pointer-events-none opacity-50">
            <SidebarNavItem {...args} isCollapsed isActive={false} />
          </div>
        </div>
      </div>
    </div>
  ),
};
