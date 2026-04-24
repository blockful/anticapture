"use client";

import { Modal } from "@/shared/components/design-system/modal/Modal";

interface DeleteActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeleteActionModal = ({
  open,
  onOpenChange,
  onConfirm,
}: DeleteActionModalProps) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title="Delete Action"
    cancelLabel="Cancel"
    confirmLabel="Delete it"
    confirmVariant="destructive"
    onCancel={() => onOpenChange(false)}
    onConfirm={onConfirm}
  >
    <p className="text-secondary text-sm leading-5">
      This will permanently remove the action from your proposal.
    </p>
  </Modal>
);
