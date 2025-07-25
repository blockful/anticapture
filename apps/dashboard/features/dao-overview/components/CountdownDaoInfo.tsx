"use client";

import { useCountdown } from "@/features/dao-overview/hooks";
import { cn } from "@/shared/utils";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import { useMemo } from "react";

export const CountdownDaoInfo = ({
  daoOverview,
  className,
}: {
  daoOverview: DaoOverviewConfig;
  className?: string;
}) => {
  const { securityCouncil } = daoOverview;
  const targetTimestamp = securityCouncil?.expiration.timestamp;
  const countdown = useCountdown(targetTimestamp);

  const formattedCountdown = useMemo(() => {
    if (!countdown || countdown.isLoading) return null;
    return {
      days: countdown.days,
      hours: countdown.hours,
      minutes: countdown.minutes,
      seconds: countdown.seconds,
    };
  }, [countdown]);

  if (!formattedCountdown) return null;

  return (
    <div
      className={cn(
        "border-light-dark bg-surface-contrast flex h-full w-fit gap-1.5 rounded-lg border px-2 py-1 sm:w-full sm:gap-3 sm:px-1.5",
        className,
      )}
    >
      <div className="s flex items-center gap-1 pl-1 sm:flex-col sm:gap-0">
        <span className="m:text-[16px] text-primary text-[14px] leading-5 font-medium">
          {formattedCountdown.days}
        </span>
        <span className="text-secondary text-xs font-medium">days</span>
      </div>
      <div className="border-middle-dark h-[85%] items-center border" />
      <div className="s flex items-center gap-1 sm:flex-col sm:gap-0">
        <span className="text-primary text-[14px] leading-5 font-medium sm:text-[16px]">
          {formattedCountdown.hours}
        </span>
        <span className="text-secondary text-xs font-medium">hours</span>
      </div>
      <div className="border-middle-dark h-[85%] items-center border" />
      <div className="s flex items-center gap-1 px-1 sm:flex-col sm:gap-0">
        <span className="text-primary text-[14px] leading-5 font-medium sm:text-[16px]">
          {formattedCountdown.minutes}
        </span>
        <span className="text-secondary text-xs font-medium">min</span>
      </div>
      <div className="border-middle-dark h-[85%] items-center border" />
      <div className="s flex items-center gap-1 pr-2 pl-1 sm:flex-col sm:gap-0">
        <span className="text-primary text-[14px] leading-5 font-medium sm:text-[16px]">
          {formattedCountdown.seconds}
        </span>
        <span className="text-secondary text-xs font-medium">sec</span>
      </div>
    </div>
  );
};
