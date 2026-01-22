import { Info } from "lucide-react";
import { Tooltip } from "@/shared/design-system/tooltips/Tooltip";

export function TooltipInfo({
  text = "",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <Tooltip tooltipContent={text} className={className}>
      <Info className="text-secondary size-3.5" />
    </Tooltip>
  );
}
