"use client";

import { Key } from "lucide-react";
import { TooltipInfo } from "@/shared/components";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import { ProgressBar } from "@/features/dao-overview/components";
import { UnderlinedLink } from "@/shared/components/design-system/links/underlined-link/UnderlinedLink";
import { useMemo } from "react";

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
    <div className={"sm:bg-surface-default flex w-full flex-col gap-4 md:p-4"}>
      <div className="flex w-full flex-col text-[13px] sm:flex-row sm:items-center sm:gap-2">
        <p className="text-primary flex items-center gap-2 font-mono font-medium tracking-wider sm:px-0">
          SECURITY COUNCIL
        </p>
        <div className="hidden size-1 items-center rounded-full bg-[#3F3F46] sm:flex" />
        <div className="flex items-center gap-1.5">
          <UnderlinedLink
            href={securityCouncil.multisig.externalLink}
            openInNewTab
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Key className="text-link size-3.5" /> Multisig:
              </div>
              <span>
                {securityCouncil.multisig.threshold}/
                {securityCouncil.multisig.signers}
              </span>
              <span className="hidden sm:inline">
                required for transactions
              </span>
              <span className="inline sm:hidden">required</span>
            </div>
          </UnderlinedLink>
          <div className="hidden sm:flex">
            <TooltipInfo text="The security council is set up as a multisig with eight signers, needing the signature of 4 out of 8 to execute a cancel transaction for an approved proposal in the Timelock contract." />
          </div>
        </div>
      </div>
      <div className="flex">
        <ProgressBar
          startDate={securityCouncil.expiration.startDate}
          progress={progress}
          warning={warning}
          daoOverview={daoOverview}
        />
      </div>
    </div>
  );
};
