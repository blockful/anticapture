// ⚠️ Internal component — use <Modal> instead of composing ModalHeader/ModalFooter directly.

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import type { ModalHeaderProps } from "@/shared/components/design-system/modal/types";
import { cn } from "@/shared/utils/cn";

/**
 * @internal
 * ModalHeader and ModalFooter are internal building blocks of Modal.
 * Do NOT use them in isolation — always compose the full Modal component instead.
 * To display a modal dialog, use <Modal> which already includes the header and footer.
 */
export const ModalHeader = ({
  title,
  description,
  className,
}: ModalHeaderProps) => {
  return (
    <div
      className={cn(
        // Layout
        "flex items-start gap-2.5",
        // Sizing
        "w-full px-4 py-3",
        // Colors/surfaces
        "bg-surface-default border-border-default border-b",
        className,
      )}
    >
      {/* Text block */}
      <div className="flex min-w-0 flex-1 flex-col gap-0">
        <DialogPrimitive.Title className="text-primary text-base font-medium leading-6">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="text-secondary text-sm font-normal leading-5">
            {description}
          </DialogPrimitive.Description>
        )}
      </div>

      {/* Close button */}
      <DialogPrimitive.Close
        className={cn(
          // Layout
          "flex shrink-0 items-center justify-center",
          // Sizing
          "size-7",
          // Colors
          "text-secondary hover:text-primary",
          // Transitions
          "transition-colors duration-150",
          // Cursor
          "cursor-pointer",
        )}
        aria-label="Close"
      >
        <X className="size-3.5" />
      </DialogPrimitive.Close>
    </div>
  );
};
