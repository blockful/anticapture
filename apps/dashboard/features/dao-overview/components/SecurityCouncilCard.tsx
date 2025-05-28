"use client";

import { CheckCheck, Key, ShieldCheck } from "lucide-react";
import { cn } from "@/shared/utils/";
import { TooltipInfo } from "@/shared/components";
import { DaoOverviewConfig } from "@/shared/dao-config/types";
import {
  CountdownDaoInfo,
  ProgressBar,
} from "@/features/dao-overview/components";
import { UnderlinedLink } from "@/shared/components/design-system/links/underlined-link/UnderlinedLink";

export const SecurityCouncilCard = ({
  daoOverview,
}: {
  daoOverview: DaoOverviewConfig;
}) => {
  const { securityCouncil } = daoOverview;
  const { progress, warning } = (function calculateProgressAndWarning() {
    if (!securityCouncil) return { progress: 0, warning: 0 };
    const start = new Date(securityCouncil.expiration.startDate).getTime();
    const end = new Date(securityCouncil.expiration.date).getTime();
    const now = Date.now();

    const total = end - start;
    const current = Math.min(now - start, total);
    const progress = Number(((current / total) * 100).toFixed(2));
    const warning = Number(
      (
        ((securityCouncil.expiration.alertExpiration - start) / total) *
        100
      ).toFixed(2),
    );
    return { progress, warning };
  })();

  if (!securityCouncil) return null;

  return (
    <div className="flex h-full w-full flex-col gap-6 py-2 sm:gap-5">
      <div className="flex w-full justify-between gap-5">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:bg-surface-contrast flex h-fit gap-1.5 rounded-md py-2 sm:gap-0 sm:p-2">
            <ShieldCheck className="text-secondary size-4 sm:size-6" />
            <p className="text-primary text-xs font-semibold uppercase sm:hidden">
              Security Council
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:gap-1.5">
            <h3 className="text-primary hidden text-xs font-semibold uppercase sm:block">
              Security Council
            </h3>
            <div className="flex w-full items-center justify-between gap-1.5 sm:justify-start">
              <p className="text-secondary text-sm font-medium">Multisig:</p>
              <div className="flex items-center gap-1.5 rounded-lg px-2 py-1 sm:rounded-none sm:bg-none sm:p-0">
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
                <UnderlinedLink
                  href={securityCouncil.multisig.externalLink}
                  openInNewTab
                >
                  <Key className="text-brand size-3.5" />
                  <span className="text-primary">
                    {securityCouncil.multisig.threshold}/
                    {securityCouncil.multisig.signers}
                  </span>
                  <span className="hidden sm:inline">
                    required for transactions
                  </span>
                  <span className="inline sm:hidden"> required</span>
                </UnderlinedLink>
                <div className="hidden sm:flex">
                  <TooltipInfo text="The security council is set up as a multisig with eight signers, needing the signature of 4 out of 8 to execute a cancel transaction for an approved proposal in the Timelock contract." />
                </div>
              </div>
            </div>

            <div className="flex w-full items-center justify-between sm:hidden">
              <p className="text-secondary text-sm font-medium">Countdown:</p>
              <CountdownDaoInfo
                daoOverview={daoOverview}
                className="bg-surface-default border-none"
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
