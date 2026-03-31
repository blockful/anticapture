export type ComboboxItemStatus = "default" | "hover" | "active" | "filter";

export type ComboboxItem = {
  /** Unique identifier for the item */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon rendered at the leading edge */
  icon?: React.ReactNode;
};

export type ComboboxItemProps = {
  /** Display label for the item */
  label: string;
  /** Icon element rendered at the leading edge (slot is only shown when this is provided) */
  icon?: React.ReactNode;
  /** Visual state of the item */
  status?: ComboboxItemStatus;
  /** Whether the item is currently selected */
  isSelected?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Mouse enter handler */
  onMouseEnter?: () => void;
  /** Mouse leave handler */
  onMouseLeave?: () => void;
  className?: string;
};

export type ComboboxProps = {
  /** List of selectable items */
  items: ComboboxItem[];
  /** Currently selected item value */
  value?: string;
  /** Placeholder text shown in the trigger button */
  placeholder?: string;
  /** Callback fired when selection changes */
  onValueChange?: (value: string) => void;
  /** Whether the combobox is disabled */
  isDisabled?: boolean;
  className?: string;
};
