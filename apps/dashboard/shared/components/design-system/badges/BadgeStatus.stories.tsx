import type { Meta, StoryObj } from "@storybook/nextjs";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";

import { getFigmaDesignConfig } from "@/shared/utils/figma-storybook";

const meta = {
  title: "Design System/Badges/BadgeStatus",
  component: BadgeStatus,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfig(
      "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=136-1178",
    ),
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
    children: {
      control: "text",
      description: "The text content of the badge",
    },
    icon: {
      control: false,
      description: "Optional icon component from lucide-react",
    },
    iconVariant: {
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
      description: "Override the icon color variant",
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
} satisfies Meta<typeof BadgeStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Active",
    variant: "primary",
  },
};

export const Primary: Story = {
  args: {
    children: "Primary Badge",
    variant: "primary",
    icon: Zap,
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
    icon: Info,
  },
};

export const Error: Story = {
  args: {
    children: "Error",
    variant: "error",
    icon: XCircle,
    iconVariant: "error",
  },
};

export const Warning: Story = {
  args: {
    children: "Warning",
    variant: "warning",
    icon: AlertTriangle,
  },
};

export const Success: Story = {
  args: {
    children: "Success",
    variant: "success",
    icon: CheckCircle2,
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
    icon: Clock,
  },
};

export const Dimmed: Story = {
  args: {
    children: "Dimmed",
    variant: "dimmed",
    icon: Info,
  },
};

export const WithoutIcon: Story = {
  args: {
    children: "No Icon",
    variant: "primary",
  },
};

export const WithCustomIconVariant: Story = {
  args: {
    children: "Custom Icon Color",
    variant: "secondary",
    icon: AlertCircle,
    iconVariant: "error",
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const LongText: Story = {
  args: {
    children: "This is a longer badge text",
    variant: "primary",
    icon: CheckCircle2,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <BadgeStatus variant="primary" icon={Zap}>
          Primary
        </BadgeStatus>
        <BadgeStatus variant="secondary" icon={Info}>
          Secondary
        </BadgeStatus>
        <BadgeStatus variant="error" icon={XCircle}>
          Error
        </BadgeStatus>
        <BadgeStatus variant="warning" icon={AlertTriangle}>
          Warning
        </BadgeStatus>
        <BadgeStatus variant="success" icon={CheckCircle2}>
          Success
        </BadgeStatus>
        <BadgeStatus variant="outline" icon={Clock}>
          Outline
        </BadgeStatus>
        <BadgeStatus variant="dimmed" icon={Info}>
          Dimmed
        </BadgeStatus>
      </div>

      <div className="flex flex-wrap gap-2">
        <BadgeStatus variant="primary">No Icon</BadgeStatus>
        <BadgeStatus variant="secondary">No Icon</BadgeStatus>
        <BadgeStatus variant="error">No Icon</BadgeStatus>
        <BadgeStatus variant="warning">No Icon</BadgeStatus>
        <BadgeStatus variant="success">No Icon</BadgeStatus>
      </div>

      <div className="flex flex-wrap gap-2">
        <BadgeStatus isLoading />
        <BadgeStatus isLoading />
        <BadgeStatus isLoading />
      </div>
    </div>
  ),
};
