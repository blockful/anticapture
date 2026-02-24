import { RequirementMetric } from "@/features/risk-analysis/components/RiskDescription";
import { RISK_AREAS } from "@/shared/constants/risk-areas";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  RiskAreaEnum,
  RiskLevel,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";

export const createRequirementsFromMetrics = (
  riskArea: RiskAreaEnum,
  daoId: DaoIdEnum,
): RequirementMetric[] => {
  const daoConfig = daoConfigByDaoId[daoId];
  const govImplItems = RISK_AREAS[riskArea].requirements;

  const filteredGovImplItems = govImplItems.filter((item) => {
    const field = daoConfig.governanceImplementation?.fields?.[item];
    return field !== undefined;
  });

  const supportsLiquidTreasuryCall =
    daoConfig.attackProfitability?.supportsLiquidTreasuryCall;

  return filteredGovImplItems.map((metricEnum) => {
    const field = daoConfig.governanceImplementation?.fields?.[metricEnum];
    const isUnsupportedAttackProfitability =
      metricEnum === GovernanceImplementationEnum.ATTACK_PROFITABILITY &&
      !supportsLiquidTreasuryCall;

    return {
      name: metricEnum,
      riskLevel: isUnsupportedAttackProfitability
        ? RiskLevel.NONE
        : field?.riskLevel || RiskLevel.NONE,
      description: field?.description || "",
    };
  });
};
