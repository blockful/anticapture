import { JSX, useMemo } from "react";

import { RiskAreaDisplayItem } from "@/features/risk-analysis/RiskAnalysisSection";
import { DaoIdEnum } from "@/shared/types/daos";
import { RiskAreaEnum } from "@/shared/types/enums";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";

const customizeGovRiskArea = (
  riskAreas: RiskAreaDisplayItem[],
  content?: JSX.Element,
): RiskAreaDisplayItem[] => {
  const customized = [...riskAreas];
  const govIndex = customized.findIndex(
    (risk) => risk.name === RiskAreaEnum.GOV_FRONTEND_RESILIENCE,
  );

  if (govIndex !== -1) {
    customized[govIndex] = {
      ...customized[govIndex],
      content,
    };
  }

  return customized;
};

export const useRiskAreaData = (daoId: DaoIdEnum, content?: JSX.Element) => {
  const daoRiskAreas = useMemo(() => getDaoRiskAreas(daoId), [daoId]);

  const riskAreasWithLevel: RiskAreaDisplayItem[] = useMemo(
    () =>
      Object.entries(daoRiskAreas).map(([name, info]) => ({
        name,
        level: info.riskLevel,
      })),
    [daoRiskAreas],
  );

  const customizedRiskAreas = useMemo(
    () => customizeGovRiskArea(riskAreasWithLevel, content),
    [riskAreasWithLevel, content],
  );

  return { daoRiskAreas, customizedRiskAreas };
};
