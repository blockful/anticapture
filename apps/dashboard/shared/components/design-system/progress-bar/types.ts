export type ProgressSize = "default" | "large";

export type ProgressLabelPosition = "top" | "bottom" | "left" | "right";

export type ProgressSegmentColor = "default" | "success" | "error" | "warning";

export type ProgressSegment = {
  value: number; // 0–100
  color?: ProgressSegmentColor;
};

export type ProgressMarker = {
  value: number; // 0–100, horizontal position along the track
  label: string;
};

export type ProgressBarProps = {
  /** Fill percentage (0–100). Ignored when `segments` is provided. */
  value?: number;
  /** Multi-color segments. Each segment's `value` is a percentage of the track width. */
  segments?: ProgressSegment[];
  /** Descriptive text rendered adjacent to the track. */
  label?: string;
  labelPosition?: ProgressLabelPosition;
  size?: ProgressSize;
  /** Reference marker (e.g. quorum threshold) shown on the track. */
  marker?: ProgressMarker;
  className?: string;
};
