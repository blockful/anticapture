export const dashboardSectionAnchorID = "dashboardSection";
export const daoInfoSectionAnchorID = "daoInfoSection";
export const tokenDistributionSectionAnchorID = "tokenDistributionSection";
export const governanceActivitySectionAnchorID = "governanceActivitySection";

export enum MetricTypesEnum {
  TOTAL_SUPPLY = "TOTAL_SUPPLY",
  DELEGATED_SUPPLY = "DELEGATED_SUPPLY",
  CEX_SUPPLY = "CEX_SUPPLY",
  DEX_SUPPLY = "DEX_SUPPLY",
  LENDING_SUPPLY = "LENDING_SUPPLY",
  CIRCULATING_SUPPLY = "CIRCULATING_SUPPLY",
  TREASURY = "TREASURY",
}

export const metricTypeArray = Object.values(MetricTypesEnum);
