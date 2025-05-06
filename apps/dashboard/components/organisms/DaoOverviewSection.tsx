"use client";

import {
  CrownIcon,
  TokensIcon,
  DaoInfoDropdown,
  DaoAvatarIcon,
  FocusIcon,
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
import { useEffect } from "react";
import { StagesDaoOverview } from "@/components/molecules";
import { RiskLevel } from "@/lib/enums/RiskLevel";
import {
  filterFieldsByRiskLevel,
  getDaoStageFromFields,
} from "@/lib/dao-config/utils";

export const DaoOverviewSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const daoOverview = daoConfig.daoOverview;
  const { isMobile, isDesktop } = useScreenSize();
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

  // Mock data for risk areas
  const riskAreas = {
    title: "RISK AREAS",
    risks: [
      { name: "SPAM VULNERABLE", level: RiskLevel.LOW },
      { name: "EXTRACTABLE VALUE", level: RiskLevel.MEDIUM },
      { name: "SAFEGUARDS", level: undefined },
      { name: "HACKABLE", level: RiskLevel.HIGH },
      { name: "GOV INTERFACES VULNERABILITY", level: RiskLevel.HIGH },
      { name: "RESPONSE TIME", level: RiskLevel.LOW },
    ],
  };

  return (
    <div
      id={SECTIONS_CONSTANTS.daoOverview.anchorId}
      className="flex h-full w-full flex-col gap-4 rounded-md px-4 pb-8 pt-10 sm:gap-0 sm:border sm:border-lightDark sm:bg-dark sm:px-0 sm:pb-0 sm:pt-0"
      ref={ref}
    >
      <div
        id="dao-info-header"
        className="hidden w-full flex-col sm:flex xl:flex-row"
      >
        <div className="flex w-full flex-col items-start gap-4 p-4 xl:w-1/2">
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
            <div className="mb-3 mt-3 flex h-full items-center gap-2">
              <h3 className="font-mono text-xs font-bold tracking-wider text-white">
                CURRENT RESILIENCE STAGE
              </h3>
              <InfoIcon className="size-4 text-foreground" />
            </div>
            <StagesDaoOverview
              currentStage={getDaoStageFromFields(
                daoConfig.governanceImplementation?.fields || [],
              )}
              highRiskItems={filterFieldsByRiskLevel(
                daoConfig.governanceImplementation?.fields || [],
                RiskLevel.HIGH,
              )}
              mediumRiskItems={filterFieldsByRiskLevel(
                daoConfig.governanceImplementation?.fields || [],
                RiskLevel.MEDIUM,
              )}
              lowRiskItems={filterFieldsByRiskLevel(
                daoConfig.governanceImplementation?.fields || [],
                RiskLevel.LOW,
              )}
            />
          </div>
        </div>
        <div className="flex w-full p-4 xl:w-1/2">
          <RiskAreaCardWrapper
            title={riskAreas.title}
            risks={riskAreas.risks}
            variant="dao-overview"
            gridColumns="grid-cols-2"
          />
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
              <h3 className="font-mono text-xs font-bold tracking-wider text-white">
                CURRENT RESILIENCE STAGE
              </h3>
              <InfoIcon className="size-4 text-foreground" />
            </div>
            <StagesDaoOverview
              currentStage={getDaoStageFromFields(
                daoConfig.governanceImplementation?.fields || [],
              )}
              highRiskItems={filterFieldsByRiskLevel(
                daoConfig.governanceImplementation?.fields || [],
                RiskLevel.HIGH,
              )}
              mediumRiskItems={filterFieldsByRiskLevel(
                daoConfig.governanceImplementation?.fields || [],
                RiskLevel.MEDIUM,
              )}
              lowRiskItems={filterFieldsByRiskLevel(
                daoConfig.governanceImplementation?.fields || [],
                RiskLevel.LOW,
              )}
            />
          </div>
        </div>
      </div>
      <div className="hidden h-full w-full sm:flex">
        <SecurityCouncilCard daoOverview={daoOverview} />
      </div>
      <div className="mt-4 flex h-full w-full sm:hidden">
        <SecurityCouncilCard daoOverview={daoOverview} />
      </div>
      <div className="border border-lightDark sm:hidden" />
      <div
        id="dao-info-cards"
        className="flex w-full flex-col gap-2 p-0 sm:flex-row sm:border-t sm:border-lightDark sm:p-2"
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

      {/* Mobile risk areas without title */}
      <div className="mt-4 sm:hidden">
        <RiskAreaCardWrapper
          title={riskAreas.title}
          risks={riskAreas.risks}
          variant="dao-overview"
        />
      </div>
    </div>
  );
};
