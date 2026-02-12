import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { GovernanceImplementationEnum } from "@/shared/types/enums";
import { GovernanceImplementationField } from "@/shared/dao-config/types";
import { RequirementMetric } from "@/features/risk-analysis/components/RiskDescription";

interface SelectedMetricData extends GovernanceImplementationField {
  name: string;
}
export const getSelectedMetricData = (
  metric: RequirementMetric | null,
  daoId: DaoIdEnum,
): SelectedMetricData | null => {
  if (!metric) return null;

  const daoConfig = daoConfigByDaoId[daoId];
  const metricEnum = metric.name as GovernanceImplementationEnum;
  const field = daoConfig.governanceImplementation?.fields?.[metricEnum];

  if (!field) return null;

  return {
    name: metric.name,
    description: field.description,
    riskLevel: metric.riskLevel,
    currentSetting: field.currentSetting,
    impact: field.impact,
    recommendedSetting: field.recommendedSetting,
    nextStep: field.nextStep,
  };
};
