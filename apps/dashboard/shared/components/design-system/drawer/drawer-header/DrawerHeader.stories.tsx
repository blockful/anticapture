"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { DrawerHeader } from "@/shared/components/design-system/drawer/drawer-header/DrawerHeader";
import type { DrawerHeaderProps } from "@/shared/components/design-system/drawer/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<DrawerHeaderProps> = {
  title: "Feedback/Drawer/DrawerHeader",
  component: DrawerHeader,
  parameters: {
    layout: "padded",
    design: getFigmaDesignConfigByNodeId("10752-17019"),
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Drawer title (string or ReactNode)",
    },
    subtitle: {
      control: "text",
      description: "Optional subtitle rendered above the title",
    },
    onClose: {
      control: false,
      description: "Close callback",
    },
    tabs: {
      control: false,
      description: "Optional tab configuration",
    },
    activeTab: {
      control: "text",
      description: "Currently active tab ID",
    },
    onTabChange: {
      control: false,
      description: "Tab change callback",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<DrawerHeaderProps>;

export const Default: Story = {
  args: {
    title: "Proposal details",
    onClose: () => undefined,
  },
};

const AllStatesRender = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", content: null },
    { id: "activity", label: "Activity", content: null },
    { id: "settings", label: "Settings", content: null },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="w-full max-w-2xl">
          <DrawerHeader title="Proposal details" onClose={() => undefined} />
        </div>
        <span className="text-secondary text-xs">Without subtitle</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-full max-w-2xl">
          <DrawerHeader
            title="Proposal details"
            subtitle="Governance"
            onClose={() => undefined}
          />
        </div>
        <span className="text-secondary text-xs">With subtitle</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-full max-w-2xl">
          <DrawerHeader
            title="Proposal details"
            subtitle="Governance"
            onClose={() => undefined}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
        <span className="text-secondary text-xs">With subtitle and tabs</span>
      </div>
    </div>
  );
};

export const AllStates = {
  render: () => <AllStatesRender />,
};
