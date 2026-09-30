"use client";

import { useMemo } from "react";

import { useCountdown } from "@/features/dao-overview/hooks";
import type { DaoOverviewConfig } from "@/shared/dao-config/types";

export const CountdownDaoInfo = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
  className?: string;
}) => {
  const { securityCouncil } = daoOverview;
  const targetTimestamp = securityCouncil?.expiration.timestamp;
  const countdown = useCountdown(targetTimestamp);

  // timestamp === 0 marks a council with no fixed term: show a static label
  // instead of a countdown.
  const noExpiration =
    !!securityCouncil && !securityCouncil.expiration.timestamp;

  const formattedCountdown = useMemo(() => {
    if (!countdown || countdown.isLoading) return null;
    return {
      days: countdown.days,
      hours: countdown.hours,
      minutes: countdown.minutes,
      seconds: countdown.seconds,
    };
  }, [countdown]);

  if (noExpiration) {
    return (
      <p className="text-primary text-sm font-normal leading-5">
        No expiration
      </p>
    );
  }

  if (!formattedCountdown) return null;

  return (
    <p className="text-primary text-sm font-normal leading-5">
      {formattedCountdown.days}d {formattedCountdown.hours}h left
    </p>
  );
};
