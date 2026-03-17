import { SegmentedControlItem } from "@/shared/components/design-system/segmented-control/segmented-control-item/SegmentedControlItem";
import type { SegmentedControlProps } from "@/shared/components/design-system/segmented-control/types";
import { cn } from "@/shared/utils/cn";

export const SegmentedControl = ({
  items,
  value,
  size = "md",
  onValueChange,
  className,
}: SegmentedControlProps) => {
  return (
    <div
      role="radiogroup"
      className={cn(
        // Base/layout — horizontal row with tight internal gap
        "inline-flex w-fit items-center gap-1",
        // Container surface — matches Figma: bg-surface-default + border + padding
        "bg-surface-default border-border-default border p-1",
        // Allow overrides
        className,
      )}
    >
      {items.map((item) => (
        <SegmentedControlItem
          key={item.value}
          label={item.label}
          items={item.items}
          isActive={value === item.value}
          size={size}
          onClick={() => onValueChange?.(item.value)}
        />
      ))}
    </div>
  );
};
