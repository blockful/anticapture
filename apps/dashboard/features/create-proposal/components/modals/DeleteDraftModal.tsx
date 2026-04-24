"use client";

import { Modal } from "@/shared/components/design-system/modal/Modal";

interface DeleteDraftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeleteDraftModal = ({
  open,
  onOpenChange,
  onConfirm,
}: DeleteDraftModalProps) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title="Delete Draft"
    cancelLabel="Cancel"
    confirmLabel="Delete it"
    confirmVariant="destructive"
    onCancel={() => onOpenChange(false)}
    onConfirm={onConfirm}
  >
    <p className="text-secondary text-sm leading-5">
      This will permanently remove the draft from your draft list.
    </p>
  </Modal>
);
