import { DaoIdEnum } from "@/shared/types/daos";
import { RiskAreaEnum, RiskLevel } from "@/shared/types/enums";
import daoConfigByDaoId from "@/shared/dao-config";
import { RequirementMetric } from "@/features/risk-analysis/components/RiskDescription";
import { RISK_AREAS } from "@/shared/constants/risk-areas";

export const createRequirementsFromMetrics = (
  riskArea: RiskAreaEnum,
  daoId: DaoIdEnum,
): RequirementMetric[] => {
  const daoConfig = daoConfigByDaoId[daoId];
  const govImplItems = RISK_AREAS[riskArea].requirements;

  return govImplItems.map((metricEnum) => {
    const field = daoConfig.governanceImplementation?.fields?.[metricEnum];
    return {
      name: metricEnum,
      riskLevel: field?.riskLevel || RiskLevel.NONE,
      description: field?.description || "",
    };
  });
};
