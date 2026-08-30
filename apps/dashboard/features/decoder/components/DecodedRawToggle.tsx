"use client";

import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import type { ViewMode } from "@/features/decoder/types";

/** The "decoded | raw" segmented control pinned bottom-left on every card. */
export const DecodedRawToggle = ({
  value,
  onValueChange,
}: {
  value: ViewMode;
  onValueChange: (view: ViewMode) => void;
}) => (
  <SegmentedControl
    size="sm"
    items={[
      { label: "decoded", value: "decoded" },
      { label: "raw", value: "raw" },
    ]}
    value={value}
    onValueChange={(next) => onValueChange(next as ViewMode)}
  />
);
