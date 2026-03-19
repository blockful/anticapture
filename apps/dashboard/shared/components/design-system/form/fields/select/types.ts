export type SelectItem = {
  /** Unique identifier for the option */
  value: string;
  /** Display label */
  label: string;
};

export type SelectProps = {
  /** List of selectable options */
  items: SelectItem[];
  /** Currently selected value */
  value?: string;
  /** Placeholder text shown when no item is selected */
  placeholder?: string;
  /** Callback fired when selection changes */
  onValueChange?: (value: string) => void;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select is in an error state */
  error?: boolean;
  /** Additional CSS classes for the trigger */
  className?: string;
};
