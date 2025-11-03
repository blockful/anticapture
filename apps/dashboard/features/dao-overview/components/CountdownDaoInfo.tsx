"use client";

import { useCountdown } from "@/features/dao-overview/hooks";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import { useMemo } from "react";

export const CountdownDaoInfo = ({
  daoOverview,
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
    <div className="text-primary text-sm font-normal leading-5">
      {formattedCountdown.days}d {formattedCountdown.hours}h left
    </div>
  );
};
