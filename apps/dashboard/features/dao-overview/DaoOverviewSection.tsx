"use client";

import {
  RiskAreaCardEnum,
  RiskAreaCardWrapper,
  TooltipInfo,
} from "@/shared/components";
import { FilePenLine, LinkIcon, Shield } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
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
import { Suspense } from "react";
import { DaoOverviewSkeleton } from "@/features/dao-overview/skeleton/DaoOverviewSkeleton";

export const DaoOverviewSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const daoOverview = daoConfig.daoOverview;

  if (!daoOverview) {
    return null;
  }

  const onChainOptions = [
    ...(daoOverview.contracts?.governor
      ? [
          {
            value: "Governor",
            icon: <Shield className="text-link size-4" />,
            href: `${daoOverview.chain.blockExplorers?.default.url}/address/${daoOverview.contracts?.governor}`,
          },
        ]
      : []),
    ...(daoOverview.contracts?.token
      ? [
          {
            value: "Token",
            icon: <TokensIcon className="text-link size-4" />,
            href: `${daoOverview.chain.blockExplorers?.default.url}/address/${daoOverview.contracts?.token}`,
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
            href: daoOverview.snapshot,
          },
        ]
      : []),
    ...(daoOverview.contracts?.token
      ? [
          {
            value: "Token",
            icon: <TokensIcon className="text-link size-4" />,
            href: `${daoOverview.chain.blockExplorers?.default.url}/address/${daoOverview.contracts?.token}`,
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

  return (
    <Suspense fallback={<DaoOverviewSkeleton />}>
      <div className="sm:bg-surface-default flex h-full w-full flex-col gap-4 px-4 py-8 sm:gap-0 sm:p-5">
        <div
          id="dao-info-header"
          className="hidden w-full flex-col sm:flex xl:flex-row"
        >
          {/* Desktop: DAO info and Risk Areas with vertical divider */}
          <div className="flex w-full flex-col items-start gap-5 xl:w-1/2">
            {/* DAO Info */}
            <div className="flex gap-3.5">
              <div className="flex">
                <DaoAvatarIcon
                  daoId={daoId}
                  className="size-icon-xl"
                  isRounded
                />
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <h3 className="text-primary text-[24px] font-medium leading-8">
                    {daoConfig.name}
                  </h3>
                </div>
                <div className="flex gap-2">
                  {onChainOptions.length > 0 && (
                    <DaoInfoDropdown
                      defaultValue={{
                        value: "OnChain Gov",
                        icon: <LinkIcon className="text-primary size-3.5" />,
                        href: "",
                      }}
                      options={onChainOptions}
                    />
                  )}
                  {offChainOptions.length > 0 && (
                    <DaoInfoDropdown
                      defaultValue={{
                        value: "OffChain Gov",
                        icon: <FilePenLine className="text-primary size-3.5" />,
                        href: "",
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
                currentStage={getDaoStageFromFields({
                  fields: fieldsToArray(
                    daoConfig.governanceImplementation?.fields,
                  ),
                  noStage: daoConfig.noStage,
                })}
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
                onRiskClick={() => {}}
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
            <h2 className="text-primary text-[24px] font-semibold leading-8">
              {daoConfig.name}
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <DaoInfoDropdown
                defaultValue={{
                  value: "OnChain Gov",
                  icon: <LinkIcon className="text-primary size-3.5" />,
                  href: "",
                }}
                options={onChainOptions}
              />
              <DaoInfoDropdown
                defaultValue={{
                  value: "OffChain Gov",
                  icon: <FilePenLine className="text-primary size-3.5" />,
                  href: "",
                }}
                options={offChainOptions}
              />
            </div>
            <div className="flex w-full flex-col">
              <div className="mb-3 mt-3 flex h-full items-center gap-2">
                <p className="text-primary font-mono text-xs font-medium tracking-wider">
                  RESILIENCE STAGE
                </p>
                <TooltipInfo text="Resilience Stages are based on governance mechanisms, considering the riskier exposed vector as criteria for progression." />
              </div>
              <StagesDaoOverview
                currentStage={getDaoStageFromFields({
                  fields: fieldsToArray(
                    daoConfig.governanceImplementation?.fields,
                  ),
                  noStage: daoConfig.noStage,
                })}
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
                <h3 className="text-primary font-mono text-xs font-medium tracking-wider">
                  RISK AREAS
                </h3>
              </div>
              <RiskAreaCardWrapper
                title={riskAreas.title}
                riskAreas={riskAreas.risks}
                onRiskClick={() => {}}
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
    </Suspense>
  );
};
