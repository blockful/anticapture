"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { GovernanceImplementationDrawer } from "@/features/risk-analysis/components/GovernanceImplementationDrawer";
import {
  RequirementMetric,
  RiskDescription,
} from "@/features/risk-analysis/components/RiskDescription";
import { useRiskAreaData } from "@/features/risk-analysis/hooks/useRiskAreaData";
import { createRequirementsFromMetrics } from "@/features/risk-analysis/utils/createRequirementsFromMetrics";
import { getSelectedMetricData } from "@/features/risk-analysis/utils/getSelectedMetricData";
import {
  RiskAreaCardEnum,
  RiskAreaCardWrapper,
} from "@/shared/components/cards/RiskAreaCard";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { RISK_AREAS } from "@/shared/constants/risk-areas";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  RiskLevel,
  RiskAreaEnum,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";

export interface RiskAreaDisplayItem {
  name: string;
  level: RiskLevel;
  content?: ReactNode;
}

interface DrawerState {
  isOpen: boolean;
  metric: RequirementMetric | null;
}

const GovFrontendVulnerabilityLabel = (
  <span className="line-height-[0] inline-flex flex-wrap align-baseline">
    <span className="inline-block">GOV FRONT-END VULNERABILITY</span>
  </span>
);

const EmptyRiskState = (
  <div className="border-light-dark bg-surface-default flex h-full items-center justify-center border p-5">
    <p className="text-secondary text-center">
      Select a risk area to view details
    </p>
  </div>
);

const generateRiskDescriptions = (
  daoId: DaoIdEnum,
  daoRiskAreas: ReturnType<typeof getDaoRiskAreas>,
  onMetricClick: (requirement: RequirementMetric) => void,
): Record<string, ReactNode> => {
  const daoConfig = daoConfigByDaoId[daoId];
  const descriptions: Record<string, ReactNode> = {};

  Object.entries(RISK_AREAS).forEach(([riskAreaKey, riskAreaInfo]) => {
    const riskArea = riskAreaKey as RiskAreaEnum;
    const riskExposure =
      daoConfig.attackExposure?.defenseAreas?.[riskArea]?.description ||
      "Risk exposure data not available";

    descriptions[riskArea] = (
      <RiskDescription
        title={riskAreaInfo.title}
        defenseDefinition={riskAreaInfo.description}
        riskExposure={riskExposure}
        requirements={createRequirementsFromMetrics(riskArea, daoId)}
        riskLevel={daoRiskAreas[riskArea].riskLevel}
        onMetricClick={onMetricClick}
      />
    );
  });

  return descriptions;
};

export const RiskAnalysisSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [activeRisk, setActiveRisk] = useState<RiskAreaEnum | undefined>(
    RiskAreaEnum.SPAM_RESISTANCE,
  );
  const [displayedRisk, setDisplayedRisk] = useState<RiskAreaEnum | undefined>(
    activeRisk,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    metric: null,
  });

  const { daoRiskAreas, customizedRiskAreas } = useRiskAreaData(
    daoId,
    GovFrontendVulnerabilityLabel,
  );

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleRiskClick = useCallback((riskName: RiskAreaEnum) => {
    setActiveRisk(riskName);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    setIsTransitioning(true);
    transitionTimeoutRef.current = setTimeout(() => {
      setDisplayedRisk(riskName);
      setIsTransitioning(false);
    }, 150);
  }, []);

  const handleMetricClick = useCallback((requirement: RequirementMetric) => {
    setDrawerState({
      isOpen: true,
      metric: requirement,
    });
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerState({
      isOpen: false,
      metric: null,
    });
  }, []);

  const riskDescriptions = useMemo(
    () => generateRiskDescriptions(daoId, daoRiskAreas, handleMetricClick),
    [daoId, daoRiskAreas, handleMetricClick],
  );

  const selectedMetricData = useMemo(
    () => getSelectedMetricData(drawerState.metric, daoId),
    [drawerState.metric, daoId],
  );

  const metricEnum = drawerState.metric?.name as
    | GovernanceImplementationEnum
    | undefined;

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100vh-16rem)] lg:flex-row lg:gap-3">
        {/* Risk Areas Sidebar */}
        <div className="bg-surface-background lg:bg-surface-default top-24.25 sticky z-20 lg:block lg:w-2/5">
          <RiskAreaCardWrapper
            daoId={daoId}
            title="Attack Exposure"
            riskAreas={customizedRiskAreas}
            activeRiskId={activeRisk}
            onRiskClick={handleRiskClick}
            className="scrollbar-none flex overflow-x-auto lg:grid lg:grid-cols-1"
            variant={RiskAreaCardEnum.RISK_ANALYSIS}
            withTitle={false}
          />
        </div>

        {/* Mobile Divider */}
        <div className="block py-5 lg:hidden lg:p-0">
          <DividerDefault isHorizontal />
        </div>

        {/* Risk Description Content */}
        <div className="lg:w-3/5">
          <div
            ref={contentRef}
            className={`h-full transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
          >
            {displayedRisk ? riskDescriptions[displayedRisk] : EmptyRiskState}
          </div>
        </div>
      </div>

      {/* Metric Details Drawer */}
      <GovernanceImplementationDrawer
        isOpen={drawerState.isOpen}
        onClose={handleCloseDrawer}
        metricType={metricEnum ?? null}
        metricData={selectedMetricData}
      />
    </>
  );
};
