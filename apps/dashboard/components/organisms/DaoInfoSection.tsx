"use client";

import { GlobeIcon, TheSectionLayout } from "@/components/atoms";
import {
  ContractsCard,
  QuorumCard,
  SecurityCouncilCard,
  TimelockCard,
  VoteCard,
} from "@/components/molecules";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import { DaoInfoConfig } from "@/lib/dao-config/types";

export const DaoInfoSection = ({ daoInfo }: { daoInfo: DaoInfoConfig }) => {
  const DaoInfo = () => {
    return (
      <div className="grid w-full gap-2 text-white md:grid-cols-2 xl:gap-4">
        {/* Contracts info shown for all stages */}
        <ContractsCard daoInfo={daoInfo} />

        {/* Vote info shown for all stages */}
        <VoteCard daoInfo={daoInfo} />

        {/* Timelock info only shown for FULL stage */}
        <TimelockCard daoInfo={daoInfo} />

        {/* Quorum info shown for all stages */}
        <QuorumCard />

        {/* Security council info only shown for FULL stage */}
        {daoInfo.securityCouncil && (
          <SecurityCouncilCard
            targetTimestamp={daoInfo.securityCouncil?.expiration.timestamp ?? 0}
            securityCouncil={daoInfo.securityCouncil}
          />
        )}
      </div>
    );
  };

  return (
    <TheSectionLayout
      title={SECTIONS_CONSTANTS.daoInfo.title}
      icon={<GlobeIcon />}
      anchorId={SECTIONS_CONSTANTS.daoInfo.anchorId}
      className="gap-5 border-b-2 border-b-white/10 px-4 pb-8 pt-10 sm:gap-6 sm:px-0 sm:pb-0 sm:pt-0"
    >
      <DaoInfo />
    </TheSectionLayout>
  );
};
