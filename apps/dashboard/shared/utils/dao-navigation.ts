import daoConfigByDaoId from "@/shared/dao-config";
import type {
  DaoConfiguration,
  DaoFeaturePageSlug,
} from "@/shared/dao-config/types";
import type { DaoIdEnum } from "@/shared/types/daos";

export type DaoFeaturePage = "/" | DaoFeaturePageSlug;

const FEATURE_PAGE_SET = new Set<DaoFeaturePage>([
  "/",
  "holders-and-delegates",
  "proposals",
  "activity-feed",
  "service-providers",
  "attack-profitability",
  "resilience-stages",
  "risk-analysis",
  "token-distribution",
]);

export const isFeatureEnabledForDao = (
  daoConfig: DaoConfiguration,
  featurePage: DaoFeaturePage,
) => {
  switch (featurePage) {
    case "/":
      return daoConfig.overviewPage !== false && !!daoConfig.daoOverview;
    case "holders-and-delegates":
      return !!daoConfig.dataTables;
    case "proposals":
      return !!daoConfig.governancePage;
    case "activity-feed":
      return !!daoConfig.activityFeed;
    case "service-providers":
      return !!daoConfig.serviceProviders;
    case "attack-profitability":
      return !!daoConfig.attackProfitability?.supportsLiquidTreasuryCall;
    case "resilience-stages":
      return !!daoConfig.resilienceStages;
    case "risk-analysis":
      return !!daoConfig.attackExposure;
    case "token-distribution":
      return !!daoConfig.tokenDistribution;
    default:
      return false;
  }
};

export const getCurrentDaoFeaturePage = (
  pathname: string,
  currentDaoId?: string,
): DaoFeaturePage => {
  if (!currentDaoId) {
    return "/";
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  const currentDaoSlug = currentDaoId.toLowerCase();
  const pathnameDaoSlug = pathSegments[0]?.toLowerCase();

  if (pathnameDaoSlug !== currentDaoSlug) {
    return "/";
  }

  const section = pathSegments[1];
  if (!section || section === currentDaoSlug) {
    return "/";
  }

  if (FEATURE_PAGE_SET.has(section as DaoFeaturePage)) {
    return section as DaoFeaturePage;
  }

  return "/";
};

export const getDaoNavigationPath = ({
  targetDaoId,
  pathname,
  currentDaoId,
}: {
  targetDaoId: DaoIdEnum;
  pathname: string;
  currentDaoId?: string;
}) => {
  const targetDaoSlug = targetDaoId.toLowerCase();
  const targetDaoConfig = daoConfigByDaoId[targetDaoId];

  if (!targetDaoConfig || targetDaoConfig.disableDaoPage) {
    return `/${targetDaoSlug}`;
  }

  const currentFeaturePage = getCurrentDaoFeaturePage(pathname, currentDaoId);
  const fallbackPage = targetDaoConfig.initialPage ?? "/";
  const targetFeaturePage = isFeatureEnabledForDao(
    targetDaoConfig,
    currentFeaturePage,
  )
    ? currentFeaturePage
    : fallbackPage;

  return targetFeaturePage === "/"
    ? `/${targetDaoSlug}`
    : `/${targetDaoSlug}/${targetFeaturePage}`;
};
