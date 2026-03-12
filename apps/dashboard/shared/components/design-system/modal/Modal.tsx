"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { ModalFooter } from "@/shared/components/design-system/modal/modal-footer/ModalFooter";
import { ModalHeader } from "@/shared/components/design-system/modal/modal-header/ModalHeader";
import type { ModalProps } from "@/shared/components/design-system/modal/types";
import { cn } from "@/shared/utils/cn";

/**
 * @internal
 * ModalHeader and ModalFooter are internal building blocks of Modal.
 * Do NOT use them in isolation — always compose the full Modal component instead.
 * To display a modal dialog, use <Modal> which already includes the header and footer.
 */
export const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelLabel = "Cancel",
  confirmLabel,
  onCancel,
  onConfirm,
  isConfirmLoading = false,
  isConfirmDisabled = false,
  className,
}: ModalProps) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            // Layout
            "fixed inset-0 z-50",
            // Colors
            "bg-black/50",
            // Animations
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />

        {/* Dialog content panel */}
        <DialogPrimitive.Content
          className={cn(
            // Layout — centered in viewport
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            // Sizing
            "w-full max-w-[600px]",
            // Surface
            "bg-surface-default border-border-default border",
            // Shadow — matches Figma tailwind/shadow-xl
            "shadow-xl",
            // Overflow
            "overflow-hidden",
            // Animations
            "data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out",
            className,
          )}
        >
          {/* Header */}
          <ModalHeader title={title} description={description} />

          {/* Body */}
          <div className="bg-surface-default w-full p-4">{children}</div>

          {/* Footer */}
          <ModalFooter
            cancelLabel={cancelLabel}
            confirmLabel={confirmLabel}
            onCancel={handleCancel}
            onConfirm={onConfirm}
            isConfirmLoading={isConfirmLoading}
            isConfirmDisabled={isConfirmDisabled}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
