export const dashboardSectionAnchorID = "dashboardSection";
export const daoInfoSectionAnchorID = "daoInfoSection";
export const tokenDistributionSectionAnchorID = "tokenDistributionSection";
export const governanceActivitySectionAnchorID = "governanceActivitySection";
export const extractableValueSectionAnchorID = "extractableValueSection";

export enum MetricTypesEnum {
  TOTAL_SUPPLY = "TOTAL_SUPPLY",
  DELEGATED_SUPPLY = "DELEGATED_SUPPLY",
  CEX_SUPPLY = "CEX_SUPPLY",
  DEX_SUPPLY = "DEX_SUPPLY",
  LENDING_SUPPLY = "LENDING_SUPPLY",
  CIRCULATING_SUPPLY = "CIRCULATING_SUPPLY",
  TREASURY = "TREASURY",
  PROPOSALS = "PROPOSALS",
  ACTIVE_SUPPLY = "ACTIVE_SUPPLY",
  VOTES = "VOTES",
  AVERAGE_TURNOUT = "AVERAGE_TURNOUT",
}

export const metricTypeArray = Object.values(MetricTypesEnum);
