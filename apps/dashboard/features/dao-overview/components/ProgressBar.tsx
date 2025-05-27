"use client";

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
      <div className="bg-light-dark relative h-3 w-full">
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
          className="bg-brand group absolute left-0 z-20 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        >
          <div className="bg-brand absolute -top-[5px] -right-1.5 size-[21px] rounded-full border-2 border-[#18181B] p-2">
            <div className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white" />
          </div>
        </div>

        {warning && warning > 0 && (
          <div
            className="bg-light-dark absolute -top-2.5 -right-1.5 z-20 size-8 rounded-full border-2 border-[#18181B] p-2"
            style={{ left: `${warning}%` }}
          >
            <AlertTriangle className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-red-500" />
          </div>
        )}
      </div>

      <div className="border-tangerine relative flex h-12 w-full border-l">
        <div
          className="border-tangerine to-tangerine/20 absolute h-12 border-r bg-linear-to-r from-transparent"
          style={{ width: `calc(${progress}% - 4px)` }}
        ></div>
        <div className="flex w-full items-start justify-between px-2 py-3">
          <div className="flex flex-col justify-center">
            <p className="text-secondary text-xs font-medium">Start</p>
            <p className="text-primary text-sm font-normal">{startDate}</p>
          </div>
          <div className="flex flex-col items-end justify-center">
            <p className="text-secondary text-xs font-medium">Expiration</p>
            <p className="text-primary text-sm font-normal">{endDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
