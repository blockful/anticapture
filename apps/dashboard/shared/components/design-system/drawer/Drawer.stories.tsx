"use client";

import type { Meta } from "@storybook/nextjs";
import { useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/shared/components/design-system/drawer";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Data Display/Drawer/Drawer",
  component: DrawerRoot,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("10752-16973"),
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Whether the drawer is open",
    },
  },
} satisfies Meta<typeof DrawerRoot>;

export default meta;

const DrawerWithTrigger = ({
  title = "Drawer title",
  subtitle,
  withTabs = false,
}: {
  title?: string;
  subtitle?: string;
  withTabs?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const tabs = withTabs
    ? [
        { id: "overview", label: "Overview", content: null },
        { id: "activity", label: "Activity", content: null },
        { id: "settings", label: "Settings", content: null },
      ]
    : undefined;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <DrawerRoot open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader
            title={title}
            subtitle={subtitle}
            onClose={() => setOpen(false)}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <DrawerBody>
            <div className="text-secondary flex h-40 items-center justify-center p-5 text-sm">
              Place the content here
            </div>
          </DrawerBody>
        </DrawerContent>
      </DrawerRoot>
    </>
  );
};

export const Default = {
  render: () => <DrawerWithTrigger title="Proposal details" />,
};

export const AllStates = {
  render: () => (
    <div className="flex items-center gap-4">
      <DrawerWithTrigger title="Simple drawer" />
      <DrawerWithTrigger title="With subtitle" subtitle="Governance" />
      <DrawerWithTrigger title="With tabs" withTabs />
    </div>
  ),
};
