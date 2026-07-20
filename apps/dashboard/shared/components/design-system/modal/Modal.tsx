"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import {
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
} from "@/shared/components/design-system/drawer";
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
  ariaLabel,
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
  cancelButtonProps,
  confirmButtonProps,
  className,
  bodyClassName,
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
      cancelButtonProps={cancelButtonProps}
      confirmButtonProps={confirmButtonProps}
    />
  );

  if (isMobile) {
    return (
      <DrawerRoot open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={className}>
          {/* Headerless: keep the close affordance with a screen-reader-only
              title so the sheet stays accessible and dismissable. */}
          <DrawerHeader
            title={
              title ?? <span className="sr-only">{ariaLabel ?? "Dialog"}</span>
            }
            subtitle={description}
            onClose={() => onOpenChange(false)}
          />
          <DrawerBody className={cn("overflow-y-auto p-4", bodyClassName)}>
            {children}
          </DrawerBody>
          {footer}
        </DrawerContent>
      </DrawerRoot>
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
          {title ? (
            <ModalHeader title={title} description={description} />
          ) : (
            // Headerless: the body owns the surface; keep an accessible name
            // and a bare close button in the corner.
            <>
              <DialogPrimitive.Title className="sr-only">
                {ariaLabel ?? "Dialog"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={X}
                  aria-label="Close"
                  className="absolute right-3 top-3 z-10"
                />
              </DialogPrimitive.Close>
            </>
          )}

          {/* Body */}
          <div className={cn("bg-surface-default w-full p-4", bodyClassName)}>
            {children}
          </div>

          {/* Footer */}
          {footer}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
