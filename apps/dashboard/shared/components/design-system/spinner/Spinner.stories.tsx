import type { Meta, StoryObj } from "@storybook/nextjs";

import { Spinner } from "@/shared/components/design-system/spinner/Spinner";
import type { SpinnerProps } from "@/shared/components/design-system/spinner/Spinner";

const meta = {
  title: "Feedback/Loading Animation/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "Size variant of the spinner",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<SpinnerProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: "lg",
  },
};

export const AllStates: Story = {
  args: {
    size: "lg",
  },
  render: () => (
    <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-secondary text-xs">sm (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-secondary text-xs">md (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-secondary text-xs">lg (32px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="xl" />
        <span className="text-secondary text-xs">xl (48px)</span>
      </div>
    </div>
  ),
};
