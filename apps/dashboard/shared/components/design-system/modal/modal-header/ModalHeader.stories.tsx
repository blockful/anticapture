import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { Meta, StoryObj } from "@storybook/nextjs";

import { ModalHeader } from "@/shared/components/design-system/modal/modal-header/ModalHeader";
import type { ModalHeaderProps } from "@/shared/components/design-system/modal/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<ModalHeaderProps> = {
  title: "Feedback/Modal/ModalHeader",
  component: ModalHeader,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("14960-53381"),
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Header title text",
    },
    description: {
      control: "text",
      description: "Optional description rendered below the title",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
  decorators: [
    (Story) => (
      <DialogPrimitive.Root>
        <div className="w-full max-w-2xl">
          <Story />
        </div>
      </DialogPrimitive.Root>
    ),
  ],
};

export default meta;
type Story = StoryObj<ModalHeaderProps>;

export const Default: Story = {
  args: {
    title: "Confirm action",
    description: undefined,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="w-full max-w-2xl">
          <ModalHeader title="Confirm action" />
        </div>
        <span className="text-secondary text-xs">Without description</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-full max-w-2xl">
          <ModalHeader
            title="Confirm action"
            description="This action cannot be undone. Please review your changes before proceeding."
          />
        </div>
        <span className="text-secondary text-xs">With description</span>
      </div>
    </div>
  ),
};
