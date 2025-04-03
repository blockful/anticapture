import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/client/utils";

interface ProgressBarProps {
  startDate: string;
  endDate: string;
  progress: number;
  warning?: boolean;
  className?: string;
}

export const ProgressBar = ({
  startDate,
  endDate,
  progress,
  warning = false,
  className,
}: ProgressBarProps) => {
  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="relative h-3 w-full bg-lightDark">
        {/* Progress indicator */}
        <div
          className="group absolute left-0 h-full bg-tangerine transition-all duration-300"
          style={{ width: `${progress}%` }}
        >
          {/* Current position indicator */}
          <div className="absolute -right-1.5 -top-[5px] size-[21px] rounded-full border-2 border-darkest bg-tangerine p-2">
            <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white" />
          </div>
        </div>

        {/* Warning indicator if needed */}
        {warning && (
          <div className="absolute -right-2 -top-2">
            <AlertTriangle className="size-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Date labels */}
      <div className="relative flex h-12 w-full border-l border-tangerine">
        <div
          className="absolute h-12 border-r border-tangerine bg-gradient-to-r from-transparent to-tangerine/20"
          style={{ width: `calc(${progress}% - 4px)` }}
        ></div>
        <div className="flex w-full items-start justify-between px-2 py-3">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium text-foreground">Start</p>
            <p className="text-sm font-normal text-[#FAFAFA]">{startDate}</p>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium text-foreground">End</p>
            <p className="text-sm font-normal text-[#FAFAFA]">{endDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
