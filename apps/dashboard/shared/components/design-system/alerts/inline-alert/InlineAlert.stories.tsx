import type { Meta, StoryObj } from "@storybook/nextjs";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";

const meta = {
  title: "Design System/Alerts/InlineAlert",
  component: InlineAlert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    text: { control: "text" },
    variant: {
      control: "select",
      options: ["info", "warning", "error"],
    },
  },
} satisfies Meta<typeof InlineAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    text: "This is an informational alert message.",
    variant: "info",
  },
};

export const Warning: Story = {
  args: {
    text: "This is a warning alert message that requires attention.",
    variant: "warning",
  },
};

export const Error: Story = {
  args: {
    text: "This is an error alert message indicating something went wrong.",
    variant: "error",
  },
};

export const LongText: Story = {
  args: {
    text: "This is a longer alert message that demonstrates how the component handles extended text content and maintains proper layout across different screen sizes while preserving readability.",
    variant: "info",
  },
};

export const GovernanceInfo: Story = {
  args: {
    text: "Governance proposal voting period has started.",
    variant: "info",
  },
};

export const SecurityWarning: Story = {
  args: {
    text: "Security council intervention may be required for this proposal.",
    variant: "warning",
  },
};

export const ValidationError: Story = {
  args: {
    text: "Unable to validate proposal parameters. Please check your input.",
    variant: "error",
  },
};

export const QuorumWarning: Story = {
  args: {
    text: "Current participation is below the required quorum threshold.",
    variant: "warning",
  },
};
