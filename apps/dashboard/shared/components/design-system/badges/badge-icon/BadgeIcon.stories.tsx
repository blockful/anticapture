import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
} from "lucide-react";

import { BadgeIcon } from "@/shared/components/design-system/badges/badge-icon/BadgeIcon";
import type { BadgeIconProps } from "@/shared/components/design-system/badges/badge-icon/BadgeIcon";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<BadgeIconProps> = {
  title: "Design System/Badges/BadgeIcon",
  component: BadgeIcon,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("11222-54092"),
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "error",
        "outline",
        "dimmed",
        "warning",
        "success",
      ],
      description: "The visual style variant of the badge",
    },
    size: {
      control: "select",
      options: ["default", "lg"],
      description: "Badge size",
    },
    icon: {
      control: false,
      description: "Icon component from lucide-react (required)",
    },
    isLoading: {
      control: "boolean",
      description: "Show loading skeleton state",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<BadgeIconProps>;

export const Default: Story = {
  args: {
    icon: Zap,
    variant: "primary",
    size: "default",
  },
};

export const AllStates = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-secondary mb-2 block text-xs">Variants</span>
        <div className="flex flex-wrap items-center gap-2">
          <BadgeIcon icon={Zap} variant="primary" />
          <BadgeIcon icon={Info} variant="secondary" />
          <BadgeIcon icon={XCircle} variant="error" />
          <BadgeIcon icon={AlertTriangle} variant="warning" />
          <BadgeIcon icon={CheckCircle2} variant="success" />
          <BadgeIcon icon={Clock} variant="outline" />
          <BadgeIcon icon={Info} variant="dimmed" />
        </div>
      </div>
      <div>
        <span className="text-secondary mb-2 block text-xs">Sizes</span>
        <div className="flex items-center gap-2">
          <BadgeIcon icon={Zap} variant="primary" size="default" />
          <BadgeIcon icon={Zap} variant="primary" size="lg" />
        </div>
      </div>
      <div>
        <span className="text-secondary mb-2 block text-xs">Loading</span>
        <BadgeIcon icon={Zap} isLoading />
      </div>
    </div>
  ),
};
