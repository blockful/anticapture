"use client";

import { useMemo } from "react";
import { CheckCheck, Key, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/client/utils";
import Link from "next/link";
import { TooltipInfo } from "@/shared/components";
import { DaoOverviewConfig } from "@/lib/dao-config/types";
import {
  CountdownDaoInfo,
  ProgressBar,
} from "@/features/dao-overview/components";

export const SecurityCouncilCard = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
}) => {
  const { securityCouncil } = daoOverview;

  const progress = useMemo(() => {
    if (!securityCouncil) return 0;
    const start = new Date(securityCouncil.expiration.startDate).getTime();
    const end = new Date(securityCouncil.expiration.date).getTime();
    const now = Date.now();

    const total = end - start;
    const current = now - start;

    return Math.min(Math.max((current / total) * 100, 0), 100);
  }, [securityCouncil]);

  const warning = useMemo(() => {
    if (!securityCouncil) return 0;

    const start = new Date(securityCouncil.expiration.startDate).getTime();
    const end = new Date(securityCouncil.expiration.date).getTime();
    const alertTimestamp = securityCouncil.expiration.alertExpiration;

    // Convert alertTimestamp from seconds to milliseconds
    const alertMs = alertTimestamp * 1000;

    // Calculate the total duration of the progress bar
    const totalDuration = end - start;

    // Calculate the position of the warning as a percentage
    const warningPosition = ((alertMs - start) / totalDuration) * 100;

    // Return the warning percentage if it's a valid number
    return isNaN(warningPosition)
      ? 0
      : Math.min(Math.max(warningPosition, 0), 100);
  }, [securityCouncil]);

  if (!securityCouncil) return null;

  return (
    <div className="flex h-full w-full flex-col gap-6 py-2 sm:gap-5">
      <div className="flex w-full justify-between gap-5">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-fit gap-1.5 rounded-md py-2 sm:gap-0 sm:bg-lightDark sm:p-2">
            <ShieldCheck className="size-4 text-foreground sm:size-6" />
            <h3 className="text-xs font-semibold uppercase text-[#FAFAFA] sm:hidden">
              Security Council
            </h3>
          </div>
          <div className="flex flex-col gap-3 sm:gap-1.5">
            <h3 className="hidden text-xs font-semibold uppercase text-[#FAFAFA] sm:block">
              Security Council
            </h3>
            <div className="flex w-full items-center justify-between gap-1.5 sm:justify-start">
              <p className="text-sm font-medium text-foreground">Multisig:</p>
              <div className="flex items-center gap-1.5 rounded-lg bg-dark px-2 py-1 sm:rounded-none sm:bg-none sm:p-0">
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    securityCouncil.isActive
                      ? "text-green-400"
                      : "text-red-400",
                  )}
                >
                  <CheckCheck className="size-3.5" />
                  <p className="text-sm font-medium">
                    {securityCouncil.isActive ? "Yes" : "No"}
                  </p>
                </div>
                <div className="size-1 items-center rounded-full bg-[#3F3F46] sm:flex" />
                <Link
                  href={securityCouncil.multisig.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1 border-b border-dashed border-foreground text-sm font-medium text-white duration-300 hover:border-white"
                >
                  <Key className="size-3.5 text-tangerine" />
                  {securityCouncil.multisig.threshold}/
                  {securityCouncil.multisig.signers}
                  <span className="hidden text-foreground duration-300 group-hover:text-white sm:inline">
                    {" "}
                    required for transactions
                  </span>
                  <span className="inline text-foreground duration-300 group-hover:text-white sm:hidden">
                    {" "}
                    required
                  </span>
                </Link>
                <div className="hidden sm:flex">
                  <TooltipInfo text="The security council is set up as a multisig with eight signers, needing the signature of 4 out of 8 to execute a cancel transaction for an approved proposal in the Timelock contract." />
                </div>
              </div>
            </div>

            <div className="flex w-full items-center justify-between sm:hidden">
              <p className="text-sm font-medium text-foreground">Countdown:</p>
              <CountdownDaoInfo
                daoOverview={daoOverview}
                className="border-none bg-dark"
              />
            </div>
          </div>
        </div>
        <div className="hidden sm:flex">
          <CountdownDaoInfo daoOverview={daoOverview} />
        </div>
      </div>
      <div className="flex">
        <ProgressBar
          startDate={securityCouncil.expiration.startDate}
          endDate={securityCouncil.expiration.date}
          progress={progress}
          warning={warning}
        />
      </div>
    </div>
  );
};
