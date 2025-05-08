"use client";

import {
  CrownIcon,
  TokensIcon,
  DaoInfoDropdown,
  DaoAvatarIcon,
  FocusIcon,
  TooltipInfo,
} from "@/components/atoms";
import {
  QuorumCard,
  SecurityCouncilCard,
  TimelockCard,
  VoteCard,
  RiskAreaCardWrapper,
} from "@/components/molecules";
import { FilePenLine, LinkIcon, InfoIcon } from "lucide-react";
import { DaoIdEnum } from "@/lib/types/daos";
import { openEtherscanAddress } from "@/lib/utils/openEtherscanAddress";
import { SECTIONS_CONSTANTS } from "@/lib/constants";
import daoConfigByDaoId from "@/lib/dao-config";
import { Address } from "viem";
import { useInView } from "react-intersection-observer";
import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { useEffect, useState } from "react";
import { StagesDaoOverview } from "@/components/molecules";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import { useDaoPageInteraction } from "@/contexts/DaoPageInteractionContext";
import { cn } from "@/lib/client/utils";
import { getDaoRiskAreas } from "@/lib/utils/risk-analysis";
import {
  fieldsToArray,
  filterFieldsByRiskLevel,
  getDaoStageFromFields,
} from "@/lib/dao-config/utils";

export const DaoOverviewSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const daoOverview = daoConfig.daoOverview;
  const { isMobile, isDesktop } = useScreenSize();
  const { scrollToSection, setActiveRisk } = useDaoPageInteraction();
  const { ref, inView } = useInView({
    threshold: isMobile ? 0.3 : isDesktop ? 0.5 : 0.7,
  });

  useEffect(() => {
    if (inView) {
      window.dispatchEvent(
        new CustomEvent("sectionInView", {
          detail: SECTIONS_CONSTANTS.daoOverview.anchorId,
        }),
      );
    }
  }, [inView]);

  if (!daoOverview) {
    return null;
  }

  const onChainOptions = [
    {
      value: "Governor",
      icon: <CrownIcon className="text-tangerine" />,
      onClick: () =>
        openEtherscanAddress(daoOverview?.contracts?.governor as Address),
    },
    {
      value: "Token",
      icon: <TokensIcon className="text-tangerine" />,
      onClick: () =>
        openEtherscanAddress(daoOverview?.contracts?.token as Address),
    },
  ];

  const offChainOptions = [
    {
      value: "Snapshot",
      icon: <FocusIcon className="text-tangerine" />,
      onClick: () =>
        window.open(
          daoOverview?.snapshot as string,
          "_blank",
          "noopener,noreferrer",
        ),
    },
    {
      value: "Token",
      icon: <TokensIcon className="text-tangerine" />,
      onClick: () =>
        openEtherscanAddress(daoOverview?.contracts?.token as Address),
    },
  ];

  // Risk areas data using our utility function
  const daoRiskAreas = getDaoRiskAreas(daoId);
  const riskAreas = {
    title: "RISK AREAS",
    risks: Object.entries(daoRiskAreas).map(([name, info]) => ({
      name,
      level: info.riskLevel,
    })),
  };

  const handleRiskAreaClick = (riskName: string) => {
    // First set the active risk
    setActiveRisk(riskName);

    // Then scroll to the risk analysis section
    scrollToSection(SECTIONS_CONSTANTS.riskAnalysis.anchorId);
  };

  return (
    <div
      id={SECTIONS_CONSTANTS.daoOverview.anchorId}
      className="flex h-full w-full flex-col gap-4 px-4 py-8 sm:gap-0 sm:bg-dark sm:p-5"
      ref={ref}
    >
      <div
        id="dao-info-header"
        className="hidden w-full flex-col sm:flex xl:flex-row"
      >
        {/* Desktop: DAO info and Risk Areas with vertical divider */}
        <div className="flex w-full flex-col items-start gap-5 xl:w-1/2">
          {/* DAO Info */}
          <div className="flex gap-3.5">
            <div className="flex">
              <DaoAvatarIcon daoId={daoId} className="size-icon-xl" isRounded />
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-[24px] font-semibold leading-8 text-[#FAFAFA]">
                  {daoConfig.name}
                </h2>
              </div>
              <div className="flex gap-2">
                <DaoInfoDropdown
                  defaultValue={{
                    value: "OnChain Gov",
                    icon: <LinkIcon className="size-3.5 text-[#FAFAFA]" />,
                    onClick: () => {},
                  }}
                  options={onChainOptions}
                />
                <DaoInfoDropdown
                  defaultValue={{
                    value: "OffChain Gov",
                    icon: <FilePenLine className="size-3.5 text-[#FAFAFA]" />,
                    onClick: () => {},
                  }}
                  options={offChainOptions}
                />
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col">
            <div className="mb-2 flex h-full items-center gap-2">
              <h3 className="font-mono text-xs font-medium tracking-wider text-white">
                CURRENT RESILIENCE STAGE
              </h3>
              <TooltipInfo text="Resilience Stages are based on governance mechanisms, considering the riskier exposed vector as criteria for progression." />
            </div>
            <StagesDaoOverview
              currentStage={getDaoStageFromFields(
                fieldsToArray(daoConfig.governanceImplementation?.fields),
              )}
              highRiskItems={filterFieldsByRiskLevel(
                fieldsToArray(daoConfig.governanceImplementation?.fields),
                RiskLevel.HIGH,
              )}
              mediumRiskItems={filterFieldsByRiskLevel(
                fieldsToArray(daoConfig.governanceImplementation?.fields),
                RiskLevel.MEDIUM,
              )}
              lowRiskItems={filterFieldsByRiskLevel(
                fieldsToArray(daoConfig.governanceImplementation?.fields),
                RiskLevel.LOW,
              )}
            />
          </div>
        </div>
        {/* Vertical divider for desktop layout */}
        <div className="mx-5 hidden border-l border-neutral-800 xl:block" />
        <div className="flex w-full xl:w-1/2">
          <div className="flex w-full flex-col gap-1">
            <RiskAreaCardWrapper
              title={riskAreas.title}
              riskAreas={riskAreas.risks}
              onRiskClick={(riskName) => {
                handleRiskAreaClick(riskName);
              }}
              variant="dao-overview"
            />
          </div>
        </div>
        <div className="flex w-full flex-1"></div>
      </div>
      <div id="dao-info-header" className="flex flex-col gap-3.5 sm:hidden">
        <div className="flex items-center gap-3">
          <DaoAvatarIcon daoId={daoId} className="size-icon-md" isRounded />
          <h2 className="text-[24px] font-semibold leading-8 text-[#FAFAFA]">
            {daoConfig.name}
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <DaoInfoDropdown
              defaultValue={{
                value: "OnChain Gov",
                icon: <LinkIcon className="size-3.5 text-[#FAFAFA]" />,
                onClick: () => {},
              }}
              options={onChainOptions}
            />
            <DaoInfoDropdown
              defaultValue={{
                value: "OffChain Gov",
                icon: <FilePenLine className="size-3.5 text-[#FAFAFA]" />,
                onClick: () => {},
              }}
              options={offChainOptions}
            />
          </div>
          <div className="flex w-full flex-col">
            <div className="mb-3 mt-3 flex h-full items-center gap-2">
              <h3 className="font-mono text-xs font-medium tracking-wider text-white">
                CURRENT RESILIENCE STAGE
              </h3>
              <TooltipInfo text="Resilience Stages are based on governance mechanisms, considering the riskier exposed vector as criteria for progression." />
            </div>
            <StagesDaoOverview
              currentStage={getDaoStageFromFields(
                fieldsToArray(daoConfig.governanceImplementation?.fields),
              )}
              highRiskItems={filterFieldsByRiskLevel(
                fieldsToArray(daoConfig.governanceImplementation?.fields),
                RiskLevel.HIGH,
              )}
              mediumRiskItems={filterFieldsByRiskLevel(
                fieldsToArray(daoConfig.governanceImplementation?.fields),
                RiskLevel.MEDIUM,
              )}
              lowRiskItems={filterFieldsByRiskLevel(
                fieldsToArray(daoConfig.governanceImplementation?.fields),
                RiskLevel.LOW,
              )}
            />
          </div>
          <div className="flex w-full flex-col">
            <div className="mb-3 mt-3 flex h-full items-center gap-2">
              <h3 className="font-mono text-xs font-medium tracking-wider text-white">
                RISK AREAS
              </h3>
            </div>
            <RiskAreaCardWrapper
              title={riskAreas.title}
              riskAreas={riskAreas.risks}
              onRiskClick={(riskName) => {
                handleRiskAreaClick(riskName);
              }}
              variant="dao-overview"
            />
          </div>
        </div>
      </div>
      {daoOverview.securityCouncil && (
        <div className="w-full">
          {/* Horizontal divider between main info/risk area and Security Council */}
          <div>
            <div className="my-5 w-full border-t border-lightDark" />
          </div>
          <div className="hidden h-full w-full sm:flex">
            <SecurityCouncilCard daoOverview={daoOverview} />
          </div>
          <div className="mt-4 flex h-full w-full sm:hidden">
            <SecurityCouncilCard daoOverview={daoOverview} />
          </div>
        </div>
      )}
      <div className="my-4 border border-lightDark sm:hidden" />
      <div
        id="dao-info-cards"
        className="flex w-full flex-col gap-2 p-0 sm:mt-5 sm:flex-row sm:border-t sm:border-lightDark sm:px-2 sm:pt-5"
      >
        <div className="flex w-full sm:border-r sm:border-lightDark">
          <VoteCard daoOverview={daoOverview} />
        </div>
        <div className="w-full border-b border-lightDark sm:hidden" />

        <div className="flex w-full sm:border-r sm:border-lightDark">
          <TimelockCard daoOverview={daoOverview} />
        </div>
        <div className="w-full border-b border-lightDark sm:hidden" />

        <div className="flex w-full">
          <QuorumCard />
        </div>
        <div className="w-full border-b border-lightDark sm:hidden" />
      </div>
    </div>
  );
};
