"use client"

import { AlertTriangle } from "lucide-react";
import { cn } from "@/shared/utils";

interface ProgressBarProps {
  startDate: string;
  endDate: string;
  progress: number;
  warning: number;
  className?: string;
}

export const ProgressBar = ({
  startDate,
  endDate,
  progress,
  warning,
  className,
}: ProgressBarProps) => {
  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="relative h-3 w-full bg-lightDark">
        {warning && warning > 0 && (
          <div
            className="absolute z-10 h-full"
            style={{
              left: `calc(${warning}% + 4px)`,
              width: `calc(${100 - warning}% - 4px)`,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                #F8717112 4px,
                #F8717112 10px,
                #27272A12 10px,
                #27272A12 20px
              )`,
            }}
          />
        )}

        <div
          className="group absolute left-0 z-20 h-full bg-tangerine transition-all duration-300"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute -right-1.5 -top-[5px] size-[21px] rounded-full border-2 border-darkest bg-tangerine p-2">
            <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white" />
          </div>
        </div>

        {warning && warning > 0 && (
          <div
            className="absolute -right-1.5 -top-2.5 z-20 size-8 rounded-full border-2 border-darkest bg-lightDark p-2"
            style={{ left: `${warning}%` }}
          >
            <AlertTriangle className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-red-500" />
          </div>
        )}
      </div>

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
          <div className="flex flex-col items-end justify-center">
            <p className="text-xs font-medium text-foreground">Expiration</p>
            <p className="text-sm font-normal text-[#FAFAFA]">{endDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
