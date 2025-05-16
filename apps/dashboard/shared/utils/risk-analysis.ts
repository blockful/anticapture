/**
 * @file risk-analysis.ts
 * Utility functions for risk analysis of DAOs
 */

import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { RiskAreaEnum } from "@/shared/types/enums/RiskArea";
import { GovernanceImplementationEnum } from "@/shared/types/enums/GovernanceImplementation";
import { RISK_AREAS } from "@/shared/constants/risk-areas";
import { RiskLevel } from "@/shared/types/enums/RiskLevel";
import { GovernanceImplementationField } from "@/shared/dao-config/types";

/**
 * Risk area information including risk level and governance implementation items
 */
export interface RiskAreaInfo {
  riskLevel: RiskLevel;
  govImplItems: {
    [key in GovernanceImplementationEnum]?: GovernanceImplementationField;
  };
}

/**
 * Gets the risk areas analysis for a specific DAO
 * @param daoId The ID of the DAO to analyze
 * @returns Record of risk areas with their risk levels and governance implementation items
 */
export function getDaoRiskAreas(
  daoId: DaoIdEnum,
): Record<RiskAreaEnum, RiskAreaInfo> {
  const daoConfig = daoConfigByDaoId[daoId];
  const govImplFields = daoConfig.governanceImplementation?.fields || {};

  // Initialize the result with all risk areas set to HIGH risk by default
  const result: Record<RiskAreaEnum, RiskAreaInfo> = {} as Record<
    RiskAreaEnum,
    RiskAreaInfo
  >;

  // For each risk area, evaluate its risk level based on the implementation of its requirements
  for (const riskArea of Object.values(RiskAreaEnum)) {
    // Get the governance implementation items required for this risk area
    const requiredGovImplItems =
      RISK_AREAS[riskArea as RiskAreaEnum].requirements;

    // Filter the DAO's governance implementation fields to those related to this risk area
    const govImplItems: {
      [key in GovernanceImplementationEnum]?: GovernanceImplementationField;
    } = {};
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    for (const govImplItem of requiredGovImplItems) {
      if (govImplFields[govImplItem]) {
        govImplItems[govImplItem] = govImplFields[govImplItem];

        // Count the risk levels of implemented items
        switch (govImplFields[govImplItem].riskLevel) {
          case RiskLevel.HIGH:
            highRiskCount++;
            break;
          case RiskLevel.MEDIUM:
            mediumRiskCount++;
            break;
          case RiskLevel.LOW:
            lowRiskCount++;
            break;
        }
      } else {
        lowRiskCount++;
      }
    }

    // Determine the overall risk level for this area
    let riskLevel: RiskLevel;

    // If all required items are implemented with LOW risk, the area is LOW risk
    if (
      lowRiskCount === requiredGovImplItems.length &&
      requiredGovImplItems.length > 0
    ) {
      riskLevel = RiskLevel.LOW;
    }
    // If there are any HIGH risk implementations, the area is HIGH risk
    else if (highRiskCount > 0) {
      riskLevel = RiskLevel.HIGH;
    }
    // If there are any MEDIUM risk implementations and no HIGH risk, the area is MEDIUM risk
    else if (mediumRiskCount > 0) {
      riskLevel = RiskLevel.MEDIUM;
    }
    // If no implementations or insufficient, consider it HIGH risk
    else {
      riskLevel = RiskLevel.HIGH;
    }

    // Store the risk area information
    result[riskArea as RiskAreaEnum] = {
      riskLevel,
      govImplItems,
    };
  }

  return result;
}
