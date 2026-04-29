"use client";

import { Modal } from "@/shared/components/design-system/modal/Modal";

interface LeaveWithoutSavingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
}

export const LeaveWithoutSavingModal = ({
  open,
  onOpenChange,
  onLeave,
}: LeaveWithoutSavingModalProps) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title="Are you sure you want to leave this page?"
    cancelLabel="Stay"
    confirmLabel="Leave"
    confirmVariant="destructive"
    onCancel={() => onOpenChange(false)}
    onConfirm={onLeave}
    className="data-[vaul-drawer-direction=bottom]:h-auto!"
  >
    <p className="text-secondary text-sm leading-5">
      It looks like you&apos;re in the middle of writing a proposal. If you
      leave without saving, you&apos;ll lose your progress.
    </p>
  </Modal>
);
