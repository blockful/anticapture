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
  confirmVariant = "primary",
  leading,
  className,
}: ModalFooterProps) => {
  return (
    <div
      className={cn(
        // Layout
        "flex items-center gap-2",
        // Sizing
        "w-full px-4 py-3",
        // Colors/surfaces
        "bg-surface-default border-border-default border-t",
        className,
      )}
    >
      {leading && <div className="min-w-0 flex-1">{leading}</div>}
      <div className={cn("flex items-center gap-2", !leading && "ml-auto")}>
        {cancelLabel && (
          <Button variant="outline" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}

        {confirmLabel && (
          <Button
            variant={confirmVariant}
            size="md"
            onClick={onConfirm}
            loading={isConfirmLoading}
            disabled={isConfirmDisabled}
          >
            {confirmLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
