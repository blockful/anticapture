import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  BarChart,
  Bomb,
  Landmark,
  Newspaper,
  PieChart,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

import { HeaderDAOSidebarDropdown } from "@/shared/components/dropdowns/HeaderDAOSidebarDropdown";
import { Sidebar } from "@/shared/components/design-system/navigation/sidebar/Sidebar";
import type { SidebarProps } from "@/shared/components/design-system/navigation/sidebar/Sidebar";
import { SidebarNavItem } from "@/shared/components/design-system/navigation/sidebar-nav-item/SidebarNavItem";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const navItems = [
  { icon: PieChart, label: "Overview", isActive: true },
  { icon: UserCheck, label: "Holders & Delegates" },
  { icon: Landmark, label: "Proposals" },
  { icon: Newspaper, label: "Activity Feed", isNew: true },
  { icon: BarChart, label: "Resilience Stages" },
  { icon: Bomb, label: "Attack Exposure" },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<SidebarProps> = {
  title: "Navigation/Sidebar/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    design: getFigmaDesignConfigByNodeId("7896-9014"),
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/uni",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    isCollapsed: {
      control: "boolean",
      description:
        "Collapsed state — narrows sidebar to icon-only (68px) width",
    },
    header: {
      control: false,
      description:
        "Slot for the top section (e.g. DAO switcher with collapse toggle)",
    },
    footer: {
      control: false,
      description: "Slot for the bottom section (e.g. wallet, settings)",
    },
    children: {
      control: false,
      description: "Nav items rendered in the scrollable body",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<SidebarProps>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    isCollapsed: false,
    header: <HeaderDAOSidebarDropdown />,
    children: (
      <>
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive ?? false}
            isNew={item.isNew ?? false}
            isCollapsed={false}
          />
        ))}
      </>
    ),
  },
};

export const AllStates: Story = {
  args: {
    isCollapsed: false,
    children: null,
  },
  render: () => (
    <div className="flex h-screen">
      {/* Expanded */}
      <Sidebar header={<HeaderDAOSidebarDropdown />}>
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive ?? false}
            isNew={item.isNew ?? false}
            isCollapsed={false}
          />
        ))}
      </Sidebar>

      {/* Collapsed */}
      <Sidebar isCollapsed header={<HeaderDAOSidebarDropdown isCollapsed />}>
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive ?? false}
            isNew={item.isNew ?? false}
            isCollapsed
          />
        ))}
      </Sidebar>
    </div>
  ),
};

export const Interactive: Story = {
  args: { children: null },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggle = () => setIsCollapsed((c) => !c);

    return (
      <div className="flex h-screen">
        <Sidebar
          isCollapsed={isCollapsed}
          header={
            <HeaderDAOSidebarDropdown
              isCollapsed={isCollapsed}
              onToggleCollapse={toggle}
            />
          }
        >
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              isActive={item.isActive ?? false}
              isNew={item.isNew ?? false}
              isCollapsed={isCollapsed}
            />
          ))}
        </Sidebar>
      </div>
    );
  },
};
