import type { Meta, StoryObj } from "@storybook/react";
import { AlertCircle, Info, CheckCircle2, AlertTriangle } from "lucide-react";

import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";

const meta: Meta<typeof BannerAlert> = {
  title: "Design System/Alerts/BannerAlert",
  component: BannerAlert,
  parameters: {
    layout: "fullwidth",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: { control: false },
    text: { control: "text" },
    link: { control: "object" },
    storageKey: { control: "text" },
    variant: {
      control: "select",
      options: ["default", "highlight"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <Info className="size-4" />,
    text: "This is a default banner alert message.",
    storageKey: "default-banner",
    variant: "default",
  },
};

export const Highlight: Story = {
  args: {
    icon: <AlertCircle className="size-4" />,
    text: "This is a highlighted banner alert message.",
    storageKey: "highlight-banner",
    variant: "highlight",
  },
};

export const WithLink: Story = {
  args: {
    icon: <CheckCircle2 className="size-4" />,
    text: "Check out our latest updates and improvements.",
    link: {
      url: "https://example.com",
      text: "Learn more",
    },
    storageKey: "with-link-banner",
    variant: "default",
  },
};

export const HighlightWithLink: Story = {
  args: {
    icon: <AlertTriangle className="size-4" />,
    text: "Important security update available.",
    link: {
      url: "https://example.com/security",
      text: "Update now",
    },
    storageKey: "security-banner",
    variant: "highlight",
  },
};

export const LongText: Story = {
  args: {
    icon: <Info className="size-4" />,
    text: "This is a longer banner alert message that demonstrates how the component handles extended text content and maintains proper layout across different screen sizes.",
    link: {
      url: "https://example.com/details",
      text: "Read full details",
    },
    storageKey: "long-text-banner",
    variant: "highlight",
  },
};

export const InternalLink: Story = {
  args: {
    icon: <AlertCircle className="size-4" />,
    text: "New governance proposal requires your attention.",
    link: {
      url: "/governance/proposals",
      text: "View proposals",
    },
    storageKey: "governance-banner",
    variant: "default",
  },
};
