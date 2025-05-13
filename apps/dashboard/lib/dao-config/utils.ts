import { GovernanceImplementationField } from "@/lib/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/lib/enums";
import { Stage } from "@/components/atoms";

/**
 * Converts any fields object to an array, with the key being set as a "name" parameter
 * @param fields Partial record of the fields
 * @returns Array<AnyField & { name: string }>
 */
export const fieldsToArray = <T extends Record<string, any>>(
  fields?: Partial<Record<GovernanceImplementationEnum, T>>,
): Array<T & { name: string }> => {
  if (!fields) return [];

  return Object.entries(fields).map(([name, field]) => ({
    ...field,
    name,
  })) as Array<T & { name: string }>;
};

/**
 * Filters an array of GovernanceImplementationField items by risk level
 * @param fields Record of GovernanceImplementationField items to filter
 * @param riskLevel The risk level to filter by
 * @returns A new array containing only items with the specified risk level
 */
export const filterFieldsByRiskLevel = (
  fields: (GovernanceImplementationField & { name: string })[],
  riskLevel: RiskLevel,
): (GovernanceImplementationField & { name: string })[] => {
  // If fields is already an array, filter it directly
  return fields.filter((field) => field.riskLevel === riskLevel);
};

/**
 * Determines the DAO stage based on governance implementation fields
 * @param fields Record of GovernanceImplementationField items to analyze
 * @returns The appropriate Stage enum value based on risk levels present
 *
 * Stage 0 (HIGH RISK): Has at least one implementation detail identified as High Risk
 * Stage 1 (MEDIUM RISK): No High Risk details, but has at least one Medium Risk detail
 * Stage 2 (LOW RISK): No High or Medium Risk details
 * Stage NONE: No governance implementation fields
 */
export const getDaoStageFromFields = (
  fields:
    | Partial<
        Record<GovernanceImplementationEnum, GovernanceImplementationField>
      >
    | GovernanceImplementationField[],
): Stage => {
  let fieldsArray: GovernanceImplementationField[];

  // Convert to array if it's a record
  if (Array.isArray(fields)) {
    fieldsArray = fields;
  } else {
    fieldsArray = fieldsToArray<GovernanceImplementationField>(fields);
  }

  const hasHighRisk = fieldsArray.some(
    (field) => field.riskLevel === RiskLevel.HIGH,
  );

  if (hasHighRisk) {
    return Stage.ZERO;
  }

  const hasMediumRisk = fieldsArray.some(
    (field) => field.riskLevel === RiskLevel.MEDIUM,
  );

  if (hasMediumRisk) {
    return Stage.ONE;
  }

  return Stage.TWO;
};
