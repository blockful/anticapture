import type { Meta, StoryObj } from "@storybook/nextjs";

import { ModalFooter } from "@/shared/components/design-system/modal/modal-footer/ModalFooter";
import type { ModalFooterProps } from "@/shared/components/design-system/modal/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<ModalFooterProps> = {
  title: "Design System/Modal/ModalFooter",
  component: ModalFooter,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("14960-53541"),
  },
  tags: ["autodocs"],
  argTypes: {
    actionsNumber: {
      control: "select",
      options: ["1", "2"],
      description:
        "Number of action buttons — '1' for Cancel only, '2' for Cancel + Confirm",
    },
    cancelLabel: {
      control: "text",
      description: "Label for the cancel button",
    },
    confirmLabel: {
      control: "text",
      description:
        "Label for the confirm button (only visible when actionsNumber='2')",
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
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<ModalFooterProps>;

export const Default: Story = {
  args: {
    actionsNumber: "2",
    cancelLabel: "Cancel",
    confirmLabel: "Confirm",
    isConfirmLoading: false,
    isConfirmDisabled: false,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="w-[600px]">
          <ModalFooter actionsNumber="1" cancelLabel="Cancel" />
        </div>
        <span className="text-secondary text-xs">One action</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-[600px]">
          <ModalFooter
            actionsNumber="2"
            cancelLabel="Cancel"
            confirmLabel="Confirm"
          />
        </div>
        <span className="text-secondary text-xs">Two actions</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-[600px]">
          <ModalFooter
            actionsNumber="2"
            cancelLabel="Cancel"
            confirmLabel="Saving..."
            isConfirmLoading
          />
        </div>
        <span className="text-secondary text-xs">Loading</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-[600px]">
          <ModalFooter
            actionsNumber="2"
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            isConfirmDisabled
          />
        </div>
        <span className="text-secondary text-xs">Disabled confirm</span>
      </div>
    </div>
  ),
};
