import type { Meta, StoryObj } from "@storybook/nextjs";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<typeof BannerAlert> = {
  title: "Feedback/Alerts/BannerAlert",
  component: BannerAlert,
  parameters: {
    layout: "fullwidth",
    design: getFigmaDesignConfigByNodeId("10150-19926"),
  },
  tags: ["autodocs"],
  argTypes: {
    icon: { control: false },
    text: { control: "text", description: "Banner message text" },
    links: { control: "object", description: "Optional link or links" },
    storageKey: {
      control: "text",
      description: "localStorage key to persist dismissed state",
    },
    variant: {
      control: "select",
      options: ["default", "highlight"],
      description: "Visual variant",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <Info className="size-4" />,
    text: "New governance proposal requires your vote.",
    storageKey: "sb-default-banner",
    variant: "default",
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-secondary px-2 text-xs">Default</span>
        <BannerAlert
          icon={<Info className="size-4" />}
          text="New governance proposal requires your vote."
          storageKey="sb-states-default"
          variant="default"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary px-2 text-xs">Highlight</span>
        <BannerAlert
          icon={<AlertCircle className="size-4" />}
          text="Security council intervention may be required."
          storageKey="sb-states-highlight"
          variant="highlight"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary px-2 text-xs">Default + link</span>
        <BannerAlert
          icon={<Info className="size-4" />}
          text="Check out the latest protocol updates."
          links={{ url: "https://example.com", text: "Learn more" }}
          storageKey="sb-states-default-link"
          variant="default"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary px-2 text-xs">Highlight + link</span>
        <BannerAlert
          icon={<AlertTriangle className="size-4" />}
          text="Important security update available."
          links={{ url: "https://example.com/security", text: "Update now" }}
          storageKey="sb-states-highlight-link"
          variant="highlight"
        />
      </div>
    </div>
  ),
};
