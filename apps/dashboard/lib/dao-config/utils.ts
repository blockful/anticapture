import { GovernanceImplementationField } from "@/lib/dao-config/types";
import { RiskLevel } from "@/lib/enums";
import { Stage } from "@/components/atoms/StagesCardRequirements";

/**
 * Filters an array of GovernanceImplementationField items by risk level
 * @param fields Array of GovernanceImplementationField items to filter
 * @param riskLevel The risk level to filter by
 * @returns A new array containing only items with the specified risk level
 */
export const filterFieldsByRiskLevel = (
  fields: GovernanceImplementationField[],
  riskLevel: RiskLevel,
): GovernanceImplementationField[] => {
  return fields.filter((field) => field.riskLevel === riskLevel);
};

/**
 * Determines the DAO stage based on governance implementation fields
 * @param fields Array of GovernanceImplementationField items to analyze
 * @returns The appropriate Stage enum value based on risk levels present
 *
 * Stage 0 (HIGH RISK): Has at least one implementation detail identified as High Risk
 * Stage 1 (MEDIUM RISK): No High Risk details, but has at least one Medium Risk detail
 * Stage 2 (LOW RISK): No High or Medium Risk details
 */
export const getDaoStageFromFields = (
  fields: GovernanceImplementationField[],
): Stage => {
  const hasHighRisk = fields.some(
    (field) => field.riskLevel === RiskLevel.HIGH,
  );

  if (hasHighRisk) {
    return Stage.ZERO;
  }

  const hasMediumRisk = fields.some(
    (field) => field.riskLevel === RiskLevel.MEDIUM,
  );

  if (hasMediumRisk) {
    return Stage.ONE;
  }

  return Stage.TWO;
};
