"use client";

import { useCountdown } from "@/hooks";
import { DaoConstantsFullySupported } from "@/lib/dao-constants/types";
import { useMemo } from "react";

export const CountdownDaoInfo = ({
  daoConstants,
}: {
  daoConstants: DaoConstantsFullySupported;
}) => {
  const { securityCouncil } = daoConstants;
  const targetTimestamp = securityCouncil?.expiration.timestamp;
  const countdown = useCountdown(targetTimestamp);

  const formattedCountdown = useMemo(() => {
    if (!countdown || countdown.isLoading) return null;
    return {
      days: countdown.days,
      hours: countdown.hours,
      minutes: countdown.minutes,
    };
  }, [countdown]);

  if (!formattedCountdown) return null;

  return (
    <div className="flex h-full w-full gap-3 rounded-lg border border-lightDark bg-lightDark px-1.5 py-1">
      <div className="flex items-center sm:flex-col">
        <span className="text-[14px] font-medium leading-5 text-white sm:text-[16px]">
          {formattedCountdown.days}
        </span>
        <span className="text-xs font-medium text-foreground">days</span>
      </div>
      <div className="h-[85%] items-center border border-middleDark" />
      <div className="flex items-center sm:flex-col">
        <span className="text-[14px] font-medium leading-5 text-white sm:text-[16px]">
          {formattedCountdown.hours}
        </span>
        <span className="text-xs font-medium text-foreground">hours</span>
      </div>
      <div className="h-[85%] items-center border border-middleDark" />
      <div className="flex items-center sm:flex-col">
        <span className="text-[14px] font-medium leading-5 text-white sm:text-[16px]">
          {formattedCountdown.minutes}
        </span>
        <span className="text-xs font-medium text-foreground">min</span>
      </div>
    </div>
  );
};
