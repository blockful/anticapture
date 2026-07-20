import type { ButtonProps } from "@/shared/components/design-system/buttons/types";

type DataAttributeProps = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

type ModalFooterButtonProps = Omit<
  ButtonProps,
  "children" | "disabled" | "loading" | "onClick" | "size" | "variant"
> &
  DataAttributeProps;

export type ModalHeaderProps = {
  /** Title text displayed in the header. */
  title: string;
  /** Optional description rendered below the title. */
  description?: string;
  /** Additional CSS classes. */
  className?: string;
};

export type ModalConfirmVariant = "primary" | "destructive";

export type ModalFooterProps = {
  /** Label for the cancel button. When provided, the cancel button is shown. */
  cancelLabel?: string;
  /** Label for the confirm button. When provided, the confirm button is shown. */
  confirmLabel?: string;
  /** Called when the cancel button is clicked. */
  onCancel?: () => void;
  /** Called when the confirm button is clicked. */
  onConfirm?: () => void;
  /** Whether the confirm button is in a loading state. */
  isConfirmLoading?: boolean;
  /** Whether the confirm button is disabled. */
  isConfirmDisabled?: boolean;
  /** Visual variant of the confirm button. Defaults to "primary". */
  confirmVariant?: ModalConfirmVariant;
  /** Extra content rendered before the cancel/confirm buttons (e.g. a progress indicator). */
  leading?: React.ReactNode;
  /** Additional props passed to the cancel button. */
  cancelButtonProps?: ModalFooterButtonProps;
  /** Additional props passed to the confirm button. */
  confirmButtonProps?: ModalFooterButtonProps;
  /** Additional CSS classes. */
  className?: string;
};

export type ModalProps = {
  /** Controls whether the dialog is open. */
  open: boolean;
  /** Called when the open state changes. */
  onOpenChange: (open: boolean) => void;
  /**
   * Title passed to ModalHeader. Optional: when omitted, the header chrome is
   * not rendered and the body owns the full surface (e.g. a centered login
   * layout). A bare close button is still shown, and `ariaLabel` provides the
   * dialog's accessible name.
   */
  title?: string;
  /**
   * Accessible name for the dialog when `title` is omitted. Required by the
   * dialog primitive for screen readers; ignored when `title` is set.
   */
  ariaLabel?: string;
  /** Optional description passed to ModalHeader. */
  description?: string;
  /** Modal body content. */
  children: React.ReactNode;
  /** Label for the cancel button. When provided, the cancel button is shown. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Label for the confirm button. When provided, the confirm button is shown. */
  confirmLabel?: string;
  /** Called when the cancel button is clicked. Defaults to closing the modal. */
  onCancel?: () => void;
  /** Called when the confirm button is clicked. */
  onConfirm?: () => void;
  /** Whether the confirm button is in a loading state. */
  isConfirmLoading?: boolean;
  /** Whether the confirm button is disabled. */
  isConfirmDisabled?: boolean;
  /** Visual variant of the confirm button. Defaults to "primary". */
  confirmVariant?: ModalConfirmVariant;
  /** Extra content rendered in the footer before the cancel/confirm buttons. */
  footerLeading?: React.ReactNode;
  /** Additional props passed to the cancel button. */
  cancelButtonProps?: ModalFooterButtonProps;
  /** Additional props passed to the confirm button. */
  confirmButtonProps?: ModalFooterButtonProps;
  /** Additional CSS classes for the dialog content panel. */
  className?: string;
  /** Additional CSS classes for the modal body. */
  bodyClassName?: string;
};
