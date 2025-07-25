"use client";

import {
  RiskAreaCardEnum,
  RiskAreaCardWrapper,
  TooltipInfo,
} from "@/shared/components";
import { FilePenLine, LinkIcon, Shield } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import { openEtherscanAddress } from "@/shared/utils/openEtherscanAddress";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import daoConfigByDaoId from "@/shared/dao-config";
import { useInView } from "react-intersection-observer";
import { useScreenSize } from "@/shared/hooks";
import { useEffect } from "react";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { useDaoPageInteraction } from "@/shared/contexts/DaoPageInteractionContext";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";
import {
  fieldsToArray,
  filterFieldsByRiskLevel,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import {
  DaoInfoDropdown,
  QuorumCard,
  SecurityCouncilCard,
  StagesDaoOverview,
  TimelockCard,
  VoteCard,
} from "@/features/dao-overview/components";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { LightningBoltIcon, TokensIcon } from "@radix-ui/react-icons";
import { RiskAreaEnum } from "@/shared/types/enums/RiskArea";
import { Address } from "viem";

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
    ...(daoOverview.contracts?.governor
      ? [
          {
            value: "Governor",
            icon: <Shield className="text-link size-4" />,
            onClick: () =>
              openEtherscanAddress(daoOverview.contracts?.governor as Address),
          },
        ]
      : []),
    ...(daoOverview.contracts?.token
      ? [
          {
            value: "Token",
            icon: <TokensIcon className="text-link size-4" />,
            onClick: () =>
              openEtherscanAddress(daoOverview.contracts?.token as Address),
          },
        ]
      : []),
  ];

  const offChainOptions = [
    ...(daoOverview.snapshot
      ? [
          {
            value: "Snapshot",
            icon: <LightningBoltIcon className="text-link size-4" />,
            onClick: () =>
              window.open(
                daoOverview.snapshot as string,
                "_blank",
                "noopener,noreferrer",
              ),
          },
        ]
      : []),
    ...(daoOverview.contracts?.token
      ? [
          {
            value: "Token",
            icon: <TokensIcon className="text-link size-4" />,
            onClick: () =>
              openEtherscanAddress(daoOverview.contracts?.token as Address),
          },
        ]
      : []),
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

  const handleRiskAreaClick = (riskName: RiskAreaEnum) => {
    // First set the active risk
    setActiveRisk(riskName);

    // Then scroll to the risk analysis section
    scrollToSection(SECTIONS_CONSTANTS.riskAnalysis.anchorId);
  };

  return (
    <div
      id={SECTIONS_CONSTANTS.daoOverview.anchorId}
      className="sm:bg-surface-default flex h-full w-full flex-col gap-4 px-4 py-8 sm:gap-0 sm:p-5"
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
                <h3 className="text-primary text-[24px] leading-8 font-medium">
                  {daoConfig.name}
                </h3>
              </div>
              <div className="flex gap-2">
                {onChainOptions.length > 0 && (
                  <DaoInfoDropdown
                    defaultValue={{
                      value: "OnChain Gov",
                      icon: <LinkIcon className="text-primary size-3.5" />,
                      onClick: () => {},
                    }}
                    options={onChainOptions}
                  />
                )}
                {offChainOptions.length > 0 && (
                  <DaoInfoDropdown
                    defaultValue={{
                      value: "OffChain Gov",
                      icon: <FilePenLine className="text-primary size-3.5" />,
                      onClick: () => {},
                    }}
                    options={offChainOptions}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex h-full w-full flex-col">
            <div className="mb-2 flex h-full items-center gap-2">
              <p className="text-primary font-mono text-xs font-medium tracking-wider">
                RESILIENCE STAGE
              </p>
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
              variant={RiskAreaCardEnum.DAO_OVERVIEW}
              className="grid grid-cols-2 gap-1"
            />
          </div>
        </div>
        <div className="flex w-full flex-1"></div>
      </div>
      <div id="dao-info-header" className="flex flex-col gap-3.5 sm:hidden">
        <div className="flex items-center gap-3">
          <DaoAvatarIcon daoId={daoId} className="size-icon-md" isRounded />
          <h2 className="text-primary text-[24px] leading-8 font-semibold">
            {daoConfig.name}
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <DaoInfoDropdown
              defaultValue={{
                value: "OnChain Gov",
                icon: <LinkIcon className="text-primary size-3.5" />,
                onClick: () => {},
              }}
              options={onChainOptions}
            />
            <DaoInfoDropdown
              defaultValue={{
                value: "OffChain Gov",
                icon: <FilePenLine className="text-primary size-3.5" />,
                onClick: () => {},
              }}
              options={offChainOptions}
            />
          </div>
          <div className="flex w-full flex-col">
            <div className="mt-3 mb-3 flex h-full items-center gap-2">
              <p className="text-primary font-mono text-xs font-medium tracking-wider">
                RESILIENCE STAGE
              </p>
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
            <div className="mt-3 mb-3 flex h-full items-center gap-2">
              <h3 className="text-primary font-mono text-xs font-medium tracking-wider">
                RISK AREAS
              </h3>
            </div>
            <RiskAreaCardWrapper
              title={riskAreas.title}
              riskAreas={riskAreas.risks}
              onRiskClick={(riskName) => {
                handleRiskAreaClick(riskName);
              }}
              variant={RiskAreaCardEnum.DAO_OVERVIEW}
              className="grid grid-cols-2 gap-1"
            />
          </div>
        </div>
      </div>
      {daoOverview.securityCouncil && (
        <div className="w-full">
          {/* Horizontal divider between main info/risk area and Security Council */}
          <div>
            <div className="border-light-dark my-5 w-full border-t" />
          </div>
          <div className="hidden h-full w-full sm:flex">
            <SecurityCouncilCard daoOverview={daoOverview} />
          </div>
          <div className="mt-4 flex h-full w-full sm:hidden">
            <SecurityCouncilCard daoOverview={daoOverview} />
          </div>
        </div>
      )}
      <div className="border-light-dark my-4 border sm:hidden" />
      <div
        id="dao-info-cards"
        className="sm:border-light-dark flex w-full flex-col gap-2 p-0 sm:mt-5 sm:flex-row sm:border-t sm:pt-5"
      >
        <div className="sm:border-light-dark flex w-full sm:border-r">
          <VoteCard daoOverview={daoOverview} />
        </div>
        <div className="border-light-dark w-full border-b sm:hidden" />

        <div className="sm:border-light-dark flex w-full sm:border-r">
          <TimelockCard daoOverview={daoOverview} />
        </div>
        <div className="border-light-dark w-full border-b sm:hidden" />

        <div className="flex w-full">
          <QuorumCard />
        </div>
        <div className="border-light-dark w-full border-b sm:hidden" />
      </div>
    </div>
  );
};
