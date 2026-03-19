import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { DaoAvatarIcon } from "@/shared/components/icons/DaoAvatarIcon";
import { SidebarDAODropdown } from "@/shared/components/design-system/navigation/sidebar-dao-dropdown/SidebarDAODropdown";
import type { SidebarDAODropdownProps } from "@/shared/components/design-system/navigation/sidebar-dao-dropdown/SidebarDAODropdown";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

// ---------------------------------------------------------------------------
// Shared helpers — mirrors production HeaderDAOSidebarDropdown
// ---------------------------------------------------------------------------

const uniswap = DaoIdEnum.UNISWAP;
const uniswapLabel = daoConfigByDaoId[uniswap].name;

const DAOAvatar = () => (
  <DaoAvatarIcon daoId={uniswap} className="size-6" isRounded />
);

const DropdownItems = () => (
  <>
    {Object.values(DaoIdEnum).map((daoId) => (
      <button
        key={daoId}
        type="button"
        role="menuitem"
        className="text-primary hover:bg-surface-default flex w-full items-center gap-2 px-3 py-2 text-sm font-normal transition-colors"
      >
        <DaoAvatarIcon daoId={daoId} className="size-4" isRounded />
        {daoConfigByDaoId[daoId].name}
      </button>
    ))}
  </>
);

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<SidebarDAODropdownProps> = {
  title: "Navigation/Sidebar/SidebarDAODropdown",
  component: SidebarDAODropdown,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("9221-19472"),
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Name of the currently selected DAO",
    },
    avatar: {
      control: false,
      description: "Avatar node for the currently selected DAO",
    },
    isCollapsed: {
      control: "boolean",
      description:
        "Collapsed mode — hides label and caret, dropdown opens to the right",
    },
    onToggleCollapse: {
      action: "toggled",
      description:
        "Collapse toggle handler — renders the chevron button on the right edge when provided",
    },
    children: {
      control: false,
      description: "Dropdown menu items rendered when open",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<SidebarDAODropdownProps>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    label: uniswapLabel,
    avatar: <DAOAvatar />,
    isCollapsed: false,
    children: <DropdownItems />,
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
  args: { label: uniswapLabel, avatar: <DAOAvatar /> },
  render: () => (
    <div className="flex items-start gap-12">
      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">Expanded</span>
        <div className="w-[258px]">
          <SidebarDAODropdown label={uniswapLabel} avatar={<DAOAvatar />}>
            <DropdownItems />
          </SidebarDAODropdown>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">Expanded + toggle</span>
        <div className="w-[258px]">
          <SidebarDAODropdown
            label={uniswapLabel}
            avatar={<DAOAvatar />}
            onToggleCollapse={() => {}}
          >
            <DropdownItems />
          </SidebarDAODropdown>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs">Collapsed</span>
        <div className="w-[68px]">
          <SidebarDAODropdown
            label={uniswapLabel}
            avatar={<DAOAvatar />}
            isCollapsed
            onToggleCollapse={() => {}}
          >
            <DropdownItems />
          </SidebarDAODropdown>
        </div>
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  args: { label: uniswapLabel, avatar: <DAOAvatar /> },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
      <div className={isCollapsed ? "w-[68px]" : "w-[258px]"}>
        <SidebarDAODropdown
          label={uniswapLabel}
          avatar={<DAOAvatar />}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((c) => !c)}
        >
          <DropdownItems />
        </SidebarDAODropdown>
      </div>
    );
  },
};
