export type SegmentedControlSize = "sm" | "md";

export type SegmentedControlItem = {
  label: string;
  value: string;
  items?: string;
};

export type SegmentedControlItemProps = {
  label: string;
  isActive?: boolean;
  size?: SegmentedControlSize;
  items?: string;
  onClick?: () => void;
  className?: string;
};

export type SegmentedControlProps = {
  items: SegmentedControlItem[];
  value?: string;
  size?: SegmentedControlSize;
  onValueChange?: (value: string) => void;
  className?: string;
};
