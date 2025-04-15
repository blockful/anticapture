"use client";

import { useCountdown } from "@/hooks";
import { cn } from "@/lib/client/utils";
import { DaoInfoConfig } from "@/lib/dao-config/types";
import { useMemo } from "react";

export const CountdownDaoInfo = ({
  daoInfo,
  className,
}: {
  daoInfo: DaoInfoConfig;
  className?: string;
}) => {
  const { securityCouncil } = daoInfo;
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
        "flex h-full w-fit gap-1.5 rounded-lg border border-lightDark bg-lightDark px-2 py-1 sm:w-full sm:gap-3 sm:px-1.5",
        className,
      )}
    >
      <div className="s flex items-center gap-1 sm:flex-col sm:gap-0 pl-1">
        <span className="m:text-[16px] text-[14px] font-medium leading-5 text-white">
          {formattedCountdown.days}
        </span>
        <span className="text-xs font-medium text-foreground">days</span>
      </div>
      <div className="h-[85%] items-center border border-middleDark" />
      <div className="s flex items-center gap-1 sm:flex-col sm:gap-0">
        <span className="text-[14px] font-medium leading-5 text-white sm:text-[16px]">
          {formattedCountdown.hours}
        </span>
        <span className="text-xs font-medium text-foreground">hours</span>
      </div>
      <div className="h-[85%] items-center border border-middleDark" />
      <div className="s flex items-center gap-1 sm:flex-col sm:gap-0 px-1">
        <span className="text-[14px] font-medium leading-5 text-white sm:text-[16px]">
          {formattedCountdown.minutes}
        </span>
        <span className="text-xs font-medium text-foreground">min</span>
      </div>
      <div className="h-[85%] items-center border border-middleDark" />
      <div className="s flex items-center gap-1 sm:flex-col sm:gap-0 pr-2 pl-1">
        <span className="text-[14px] font-medium leading-5 text-white sm:text-[16px]">
          {formattedCountdown.seconds}
        </span>
        <span className="text-xs font-medium text-foreground">sec</span>
      </div>
    </div>
  );
};
