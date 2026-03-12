// ⚠️ Internal component — use <Modal> instead of composing ModalHeader/ModalFooter directly.

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import type { ModalFooterProps } from "@/shared/components/design-system/modal/types";
import { cn } from "@/shared/utils/cn";

/**
 * @internal
 * ModalHeader and ModalFooter are internal building blocks of Modal.
 * Do NOT use them in isolation — always compose the full Modal component instead.
 * To display a modal dialog, use <Modal> which already includes the header and footer.
 */
export const ModalFooter = ({
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  isConfirmLoading = false,
  isConfirmDisabled = false,
  className,
}: ModalFooterProps) => {
  return (
    <div
      className={cn(
        // Layout
        "flex items-center justify-end gap-2",
        // Sizing
        "w-full px-4 py-3",
        // Colors/surfaces
        "bg-surface-default border-border-default border-t",
        className,
      )}
    >
      {cancelLabel && (
        <Button variant="outline" size="md" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}

      {confirmLabel && (
        <Button
          variant="primary"
          size="md"
          onClick={onConfirm}
          loading={isConfirmLoading}
          disabled={isConfirmDisabled}
        >
          {confirmLabel}
        </Button>
      )}
    </div>
  );
};
