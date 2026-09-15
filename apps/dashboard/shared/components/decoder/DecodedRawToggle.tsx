"use client";

import { SegmentedControl } from "@/shared/components/design-system/segmented-control/SegmentedControl";
import type { ViewMode } from "@/shared/components/decoder/types";

/** The "Decoded | Raw" segmented control in the footer of a proposal action. */
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
      { label: "Decoded", value: "decoded" },
      { label: "Raw", value: "raw" },
    ]}
    value={value}
    onValueChange={(next) => onValueChange(next as ViewMode)}
  />
);
