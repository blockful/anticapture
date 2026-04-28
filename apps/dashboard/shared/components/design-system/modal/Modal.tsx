"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { ModalFooter } from "@/shared/components/design-system/modal/modal-footer/ModalFooter";
import { ModalHeader } from "@/shared/components/design-system/modal/modal-header/ModalHeader";
import type { ModalProps } from "@/shared/components/design-system/modal/types";
import { useScreenSize } from "@/shared/hooks";
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
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  isConfirmLoading = false,
  isConfirmDisabled = false,
  confirmVariant = "primary",
  footerLeading,
  className,
}: ModalProps) => {
  const { isMobile } = useScreenSize();
  // useScreenSize defaults to false until the effect runs, which would render
  // the Dialog on first paint and swap to a Drawer after hydration on mobile.
  // Wait for mount before deciding which surface to show so the user doesn't
  // see a desktop dialog flash.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  if (!isMounted && open) return null;

  const footer = (cancelLabel || confirmLabel || footerLeading) && (
    <ModalFooter
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      onCancel={handleCancel}
      onConfirm={onConfirm}
      isConfirmLoading={isConfirmLoading}
      isConfirmDisabled={isConfirmDisabled}
      confirmVariant={confirmVariant}
      leading={footerLeading}
    />
  );

  if (isMobile) {
    return (
      <DrawerPrimitive.Root
        open={open}
        onOpenChange={onOpenChange}
        direction="bottom"
      >
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
          <DrawerPrimitive.Content
            className={cn(
              "bg-surface-default border-border-default fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col overflow-hidden rounded-t-lg border-t",
              className,
            )}
          >
            <DrawerPrimitive.Title className="sr-only">
              {title}
            </DrawerPrimitive.Title>
            {description && (
              <DrawerPrimitive.Description className="sr-only">
                {description}
              </DrawerPrimitive.Description>
            )}
            <ModalHeader title={title} description={description} />
            <div className="bg-surface-default w-full flex-1 overflow-y-auto p-4">
              {children}
            </div>
            {footer}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    );
  }

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
            "max-w-150 rounded-base w-full",
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
          {footer}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
