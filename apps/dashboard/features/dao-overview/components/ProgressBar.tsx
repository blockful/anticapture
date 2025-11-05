"use client";

import { cn } from "@/shared/utils";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import { CountdownDaoInfo } from "@/features/dao-overview/components/CountdownDaoInfo";
import { TooltipInfo } from "@/shared/components";

interface ProgressBarProps {
  startDate: string;
  progress: number;
  warning: number;
  className?: string;
  daoOverview: DaoOverviewConfig;
}

export const ProgressBar = ({
  startDate,
  progress,
  warning,
  className,
  daoOverview,
}: ProgressBarProps) => {
  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="bg-surface-contrast relative h-4 w-full">
        {warning && warning > 0 && (
          <div
            className="absolute z-10 flex h-full items-center justify-center gap-1.5 py-1"
            style={{
              left: `calc(${warning}% - 64px)`,
              width: `calc(${100 - warning}% + 64px)`,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                #403033 4px,
                #403033 10px,
                #332325 10px,
                #332325 20px
              )`,
            }}
          >
            <p className="text-error flex-nowrap text-xs font-medium leading-4">
              Danger Zone
            </p>
            <TooltipInfo text="This means that the Security Council is approaching expiration and it might be good to start the process of renewal." />
          </div>
        )}

        <div
          className="bg-surface-solid-brand group absolute left-0 z-20 h-full transition-all duration-300"
          style={{ width: `${Math.floor(progress)}%` }}
        >
          <div className="border-inverted bg-tangerine absolute -right-1.5 -top-[3px] size-[21px] rounded-full border-2 p-2">
            <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white" />
          </div>
        </div>
      </div>

      <div className="border-tangerine relative flex h-12 w-full border-l">
        <div
          className="border-tangerine to-tangerine/20 bg-linear-to-r absolute h-12 border-r from-transparent"
          style={{ width: `calc(${Math.floor(progress)}% - 4px)` }}
        />
        <div className="border-surface-contrast absolute h-12 w-full border-r" />
        <div className="flex w-full items-start justify-between px-2 py-3">
          <div className="flex flex-col justify-center">
            <p className="text-secondary text-xs font-medium">Start</p>
            <p className="text-primary text-sm font-normal">{startDate}</p>
          </div>
          <div className="flex flex-col items-end justify-center">
            <p className="text-secondary text-xs font-medium">Expiration</p>
            <p className="text-primary text-sm font-normal">
              <CountdownDaoInfo daoOverview={daoOverview} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
