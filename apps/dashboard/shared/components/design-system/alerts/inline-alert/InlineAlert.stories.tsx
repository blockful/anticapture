import type { Meta, StoryObj } from "@storybook/nextjs";

import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<typeof InlineAlert> = {
  title: "Design System/Alerts/InlineAlert",
  component: InlineAlert,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("10150-19926"),
  },
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: "text",
      description: "Alert message text",
    },
    variant: {
      control: "select",
      options: ["info", "warning", "error"],
      description: "Visual variant",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: "This is an informational alert message.",
    variant: "info",
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export const AllStates: Story = {
  render: () => (
    <div className="flex w-[400px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Info</span>
        <InlineAlert
          text="This is an informational alert message."
          variant="info"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Warning</span>
        <InlineAlert
          text="This is a warning that requires your attention."
          variant="warning"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs">Error</span>
        <InlineAlert
          text="Something went wrong. Please try again."
          variant="error"
        />
      </div>
    </div>
  ),
};
