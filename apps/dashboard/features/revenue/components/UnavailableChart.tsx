import { cn } from "@/shared/utils/cn";

import { UNAVAILABLE_TEXT } from "@/features/revenue/utils/meta";

/**
 * Stands in for a chart whose data the API could not provide, so a failed or
 * empty response never looks like a real run of zeros.
 */
export const UnavailableChart = ({
  height,
  className,
}: {
  height: number;
  className?: string;
}) => (
  <div
    className={cn(
      "border-border-default text-secondary flex w-full flex-col items-center justify-center gap-1 rounded border border-dashed text-sm",
      className,
    )}
    style={{ height }}
  >
    <span className="font-medium">{UNAVAILABLE_TEXT}</span>
    <span>Up-to-date data is not available right now. Try again later.</span>
  </div>
);
