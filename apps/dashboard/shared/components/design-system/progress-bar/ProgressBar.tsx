import type {
  ProgressBarProps,
  ProgressSegmentColor,
  ProgressSize,
} from "@/shared/components/design-system/progress-bar/types";
import { cn } from "@/shared/utils/cn";

const trackHeightStyles: Record<ProgressSize, string> = {
  default: "h-1", // 4px
  large: "h-2", // 8px
};

const segmentColorStyles: Record<ProgressSegmentColor, string> = {
  default: "bg-surface-action",
  success: "bg-surface-solid-success",
  error: "bg-surface-solid-error",
  warning: "bg-surface-solid-warning",
};

export const ProgressBar = ({
  value = 0,
  segments,
  label,
  labelPosition = "top",
  size = "default",
  marker,
  className,
}: ProgressBarProps) => {
  const isRow = labelPosition === "left" || labelPosition === "right";
  const labelFirst = labelPosition === "top" || labelPosition === "left";
  const clampedValue = Math.max(0, Math.min(100, value));

  const labelNode = label ? (
    <span className="text-secondary shrink-0 whitespace-nowrap text-sm leading-5">
      {label}
    </span>
  ) : null;

  const trackNode = (
    <div className={cn("relative", isRow ? "min-w-0 flex-1" : "w-full")}>
      {/* Track background + fill (overflow-hidden to clip fill bars) */}
      <div
        className={cn(
          "bg-surface-hover w-full overflow-hidden",
          trackHeightStyles[size],
        )}
      >
        {segments ? (
          <div className="flex h-full w-full">
            {segments.map((seg, i) => (
              <div
                key={i}
                className={cn(
                  "h-full transition-all duration-300 ease-in-out",
                  segmentColorStyles[seg.color ?? "default"],
                )}
                style={{ width: `${Math.max(0, Math.min(100, seg.value))}%` }}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "h-full transition-all duration-300 ease-in-out",
              segmentColorStyles.default,
            )}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>

      {/* Marker — positioned absolute relative to the track wrapper */}
      {marker && (
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-0.5"
          style={{ left: `${marker.value}%` }}
        >
          {/* Thin vertical line spanning the full track height */}
          <div
            className={cn(
              trackHeightStyles[size],
              "bg-primary ring-border-default w-0.5 shrink-0 ring-2",
            )}
          />
          <span className="text-secondary whitespace-nowrap text-xs font-medium leading-4">
            {marker.label}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex gap-1",
        isRow ? "items-center" : "flex-col",
        className,
      )}
    >
      {labelFirst && labelNode}
      {trackNode}
      {!labelFirst && labelNode}
    </div>
  );
};
