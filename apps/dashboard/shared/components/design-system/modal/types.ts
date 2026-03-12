export type ModalActionsNumber = "1" | "2";

export type ModalHeaderProps = {
  /** Title text displayed in the header. */
  title: string;
  /** Optional description rendered below the title. */
  description?: string;
  /** Additional CSS classes. */
  className?: string;
};

export type ModalFooterProps = {
  /**
   * Number of action buttons:
   * - "1" → Cancel only
   * - "2" → Cancel + Confirm
   */
  actionsNumber?: ModalActionsNumber;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Label for the confirm button (only visible when actionsNumber="2"). Defaults to "Confirm". */
  confirmLabel?: string;
  /** Called when the cancel button is clicked. */
  onCancel?: () => void;
  /** Called when the confirm button is clicked (only used when actionsNumber="2"). */
  onConfirm?: () => void;
  /** Whether the confirm button is in a loading state. */
  isConfirmLoading?: boolean;
  /** Whether the confirm button is disabled. */
  isConfirmDisabled?: boolean;
  /** Additional CSS classes. */
  className?: string;
};

export type ModalProps = {
  /** Controls whether the dialog is open. */
  open: boolean;
  /** Called when the open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Modal title passed to ModalHeader. */
  title: string;
  /** Optional description passed to ModalHeader. */
  description?: string;
  /** Modal body content. */
  children: React.ReactNode;
  /**
   * Number of footer action buttons:
   * - "1" → Cancel only
   * - "2" → Cancel + Confirm
   */
  actionsNumber?: ModalActionsNumber;
  /** Label for the cancel button. */
  cancelLabel?: string;
  /** Label for the confirm button. */
  confirmLabel?: string;
  /** Called when the cancel button is clicked. Defaults to closing the modal. */
  onCancel?: () => void;
  /** Called when the confirm button is clicked. */
  onConfirm?: () => void;
  /** Whether the confirm button is in a loading state. */
  isConfirmLoading?: boolean;
  /** Whether the confirm button is disabled. */
  isConfirmDisabled?: boolean;
  /** Additional CSS classes for the dialog content panel. */
  className?: string;
};
