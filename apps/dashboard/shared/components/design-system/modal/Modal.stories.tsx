"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import type { ModalProps } from "@/shared/components/design-system/modal/types";
import { getFigmaDesignConfigByNodeId } from "@/shared/utils/figma-storybook";

const meta: Meta<ModalProps> = {
  title: "Data Display/Modal/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    design: getFigmaDesignConfigByNodeId("14968-53733"),
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Modal title",
    },
    description: {
      control: "text",
      description: "Optional description in the modal header",
    },
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
      description: "Whether the confirm button is loading",
    },
    isConfirmDisabled: {
      control: "boolean",
      description: "Whether the confirm button is disabled",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the dialog panel",
    },
  },
};

export default meta;
type Story = StoryObj<ModalProps>;

const ModalWithTrigger = (
  props: Omit<ModalProps, "open" | "onOpenChange"> & { triggerLabel?: string },
) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {props.triggerLabel ?? "Open modal"}
      </Button>
      <Modal open={open} onOpenChange={setOpen} {...props} />
    </>
  );
};

export const Default: Story = {
  render: (args) => (
    <ModalWithTrigger
      title={args.title ?? "Confirm action"}
      description={args.description}
      cancelLabel={args.cancelLabel}
      confirmLabel={args.confirmLabel}
      isConfirmLoading={args.isConfirmLoading}
      isConfirmDisabled={args.isConfirmDisabled}
    >
      <div className="text-secondary flex h-20 items-center justify-center text-sm">
        Place the content here
      </div>
    </ModalWithTrigger>
  ),
  args: {
    title: "Confirm action",
    description: undefined,
    cancelLabel: "Cancel",
    confirmLabel: "Confirm",
    isConfirmLoading: false,
    isConfirmDisabled: false,
  },
};

const CompositionsRender = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openSave, setOpenSave] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <Button variant="primary" onClick={() => setOpenDelete(true)}>
        Delete item
      </Button>
      <Modal
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Delete item"
        description="This action cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Delete"
      >
        <div className="text-secondary flex flex-col gap-2 text-sm">
          <p>
            Are you sure you want to permanently delete this item? All
            associated data will be removed.
          </p>
        </div>
      </Modal>

      <Button variant="primary" onClick={() => setOpenSave(true)}>
        Save changes
      </Button>
      <Modal
        open={openSave}
        onOpenChange={setOpenSave}
        title="Save changes"
        cancelLabel="Cancel"
        confirmLabel="Saving..."
        isConfirmLoading
      >
        <div className="text-secondary flex h-20 items-center justify-center text-sm">
          Your changes are being saved.
        </div>
      </Modal>

      <Button variant="primary" onClick={() => setOpenInfo(true)}>
        Info only
      </Button>
      <Modal
        open={openInfo}
        onOpenChange={setOpenInfo}
        title="Information"
        cancelLabel="Close"
      >
        <div className="text-secondary flex h-20 items-center justify-center text-sm">
          This modal provides information only and requires no further action.
        </div>
      </Modal>
    </div>
  );
};

export const Compositions: Story = {
  render: () => <CompositionsRender />,
};
