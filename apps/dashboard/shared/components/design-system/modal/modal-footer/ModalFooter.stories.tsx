import type { Meta, StoryObj } from "@storybook/nextjs";

import { ModalFooter } from "@/shared/components/design-system/modal/modal-footer/ModalFooter";
import type { ModalFooterProps } from "@/shared/components/design-system/modal/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<ModalFooterProps> = {
  title: "Feedback/Modal/ModalFooter",
  component: ModalFooter,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("14960-53541"),
  },
  tags: ["autodocs"],
  argTypes: {
    cancelLabel: {
      control: "text",
      description:
        "Label for the cancel button. When provided, the button is shown.",
    },
    confirmLabel: {
      control: "text",
      description:
        "Label for the confirm button. When provided, the button is shown.",
    },
    isConfirmLoading: {
      control: "boolean",
      description: "Whether the confirm button is in a loading state",
    },
    isConfirmDisabled: {
      control: "boolean",
      description: "Whether the confirm button is disabled",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
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
type Story = StoryObj<ModalFooterProps>;

export const Default: Story = {
  args: {
    cancelLabel: "Cancel",
    confirmLabel: "Confirm",
    isConfirmLoading: false,
    isConfirmDisabled: false,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <ModalFooter cancelLabel="Cancel" />
        <span className="text-secondary text-xs">Cancel only</span>
      </div>
      <div className="flex flex-col gap-1">
        <ModalFooter cancelLabel="Cancel" confirmLabel="Confirm" />
        <span className="text-secondary text-xs">Cancel + Confirm</span>
      </div>
      <div className="flex flex-col gap-1">
        <ModalFooter
          cancelLabel="Cancel"
          confirmLabel="Saving..."
          isConfirmLoading
        />
        <span className="text-secondary text-xs">Loading</span>
      </div>
      <div className="flex flex-col gap-1">
        <ModalFooter
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          isConfirmDisabled
        />
        <span className="text-secondary text-xs">Disabled confirm</span>
      </div>
    </div>
  ),
};
