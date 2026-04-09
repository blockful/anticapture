import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import type { DaoIdEnum } from "@/shared/types/daos";

export const WHITELABEL_ROUTES = {
  proposals: "proposals",
  delegates: "delegates",
  holdersAndDelegates: "holders-and-delegates",
  activityFeed: "activity-feed",
  serviceProviders: "service-providers",
  notifications: "notifications",
  governanceSettings: "governance-settings",
  sppAccountability: "spp-accountability",
} as const;

export type WhitelabelRouteSlug =
  (typeof WHITELABEL_ROUTES)[keyof typeof WHITELABEL_ROUTES];

const NORMALIZED_HOSTNAME_TO_DAO_ID = Object.entries(daoConfigByDaoId).reduce(
  (acc, [daoId, daoConfig]) => {
    daoConfig.whitelabel?.hostnames.forEach((hostname) => {
      acc[hostname.toLowerCase()] = daoId as DaoIdEnum;
    });

    return acc;
  },
  {} as Record<string, DaoIdEnum>,
);

export const resolveDaoIdFromHostname = (hostname: string): DaoIdEnum | null =>
  NORMALIZED_HOSTNAME_TO_DAO_ID[hostname.toLowerCase()] ?? null;

export const getWhitelabelConfig = (daoId: DaoIdEnum) =>
  daoConfigByDaoId[daoId]?.whitelabel ?? null;

export const isWhitelabelDao = (
  daoConfig?: DaoConfiguration | null,
): daoConfig is DaoConfiguration & {
  whitelabel: NonNullable<DaoConfiguration["whitelabel"]>;
} => !!daoConfig?.whitelabel;

export const getWhitelabelBasePath = ({
  daoId,
  pathname,
}: {
  daoId: DaoIdEnum;
  pathname: string;
}) => {
  const daoSlug = daoId.toLowerCase();
  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;
  const internalBasePath = `/whitelabel/${daoSlug}`;

  return normalizedPathname === `/${daoSlug}` ||
    normalizedPathname.startsWith(`/${daoSlug}/`)
    ? `/${daoSlug}`
    : normalizedPathname === internalBasePath ||
        normalizedPathname.startsWith(`${internalBasePath}/`)
      ? internalBasePath
      : "";
};

export const getDaoPagePath = ({
  daoId,
  pathname,
  page,
}: {
  daoId: DaoIdEnum;
  pathname: string;
  page: string;
}) => {
  const basePath = getWhitelabelBasePath({ daoId, pathname });

  if (!page || page === "/") {
    return basePath || "/";
  }

  return `${basePath}/${page}`;
};

export const getDaoProposalPath = ({
  daoId,
  pathname,
  proposalId,
  isOffchain = false,
}: {
  daoId: DaoIdEnum;
  pathname: string;
  proposalId: string;
  isOffchain?: boolean;
}) => {
  const basePath = getWhitelabelBasePath({ daoId, pathname });

  // Internal whitelabel path: /whitelabel/[daoId]/...
  if (basePath.startsWith("/whitelabel/")) {
    const proposalRoute = `${WHITELABEL_ROUTES.proposals}/${proposalId}`;
    return isOffchain
      ? `${basePath}/${proposalRoute}?proposalType=offchain`
      : `${basePath}/${proposalRoute}`;
  }

  // External whitelabel domain: middleware rewrites the path, so pathname
  // doesn't include the daoId prefix (basePath is "")
  if (basePath === "" && isWhitelabelDao(daoConfigByDaoId[daoId])) {
    const proposalRoute = `${WHITELABEL_ROUTES.proposals}/${proposalId}`;
    return isOffchain
      ? `/${proposalRoute}?proposalType=offchain`
      : `/${proposalRoute}`;
  }

  // Normal dashboard: /[daoId]/governance/proposal/[proposalId]
  const daoSlug = daoId.toLowerCase();
  return isOffchain
    ? `/${daoSlug}/governance/offchain-proposal/${proposalId}`
    : `/${daoSlug}/governance/proposal/${proposalId}`;
};

export const getDaoGovernanceListPath = ({
  daoId,
  pathname,
  isOffchain = false,
}: {
  daoId: DaoIdEnum;
  pathname: string;
  isOffchain?: boolean;
}) => {
  const basePath = getWhitelabelBasePath({ daoId, pathname });
  const tab = isOffchain ? "?tab=offchain" : "";

  if (basePath.startsWith("/whitelabel/")) {
    return `${basePath}/${WHITELABEL_ROUTES.proposals}${tab}`;
  }

  if (basePath === "" && isWhitelabelDao(daoConfigByDaoId[daoId])) {
    return `/${WHITELABEL_ROUTES.proposals}${tab}`;
  }

  return `/${daoId.toLowerCase()}/governance${tab}`;
};

export const getDaoNotificationsPath = ({
  daoId,
  pathname,
}: {
  daoId: DaoIdEnum;
  pathname: string;
}) => {
  const basePath = getWhitelabelBasePath({ daoId, pathname });

  if (basePath.startsWith("/whitelabel/")) {
    return `${basePath}/${WHITELABEL_ROUTES.notifications}`;
  }

  if (basePath === "" && isWhitelabelDao(daoConfigByDaoId[daoId])) {
    return `/${WHITELABEL_ROUTES.notifications}`;
  }

  return `/whitelabel/${daoId.toLowerCase()}/${WHITELABEL_ROUTES.notifications}`;
};

export const getWhitelabelForumProposalUrl = ({
  daoId,
  proposalTitle,
}: {
  daoId: DaoIdEnum;
  proposalTitle: string;
}) => {
  const forumBaseUrl = getWhitelabelConfig(daoId)?.forumBaseUrl;

  if (!forumBaseUrl) {
    return null;
  }

  const normalizedBaseUrl = forumBaseUrl.endsWith("/")
    ? forumBaseUrl
    : `${forumBaseUrl}/`;

  return `${normalizedBaseUrl}search?q=${encodeURIComponent(proposalTitle)}`;
};

export const isWhitelabelProposalDetailPath = (pathname: string) =>
  /\/proposals\/[^/]+$/.test(pathname);

export const isWhitelabelProposalListPath = (pathname: string) =>
  pathname.endsWith(`/${WHITELABEL_ROUTES.proposals}`);

export const getWhitelabelSearchPlaceholder = (pathname: string) =>
  isWhitelabelProposalListPath(pathname) ||
  isWhitelabelProposalDetailPath(pathname)
    ? "Search for a proposal"
    : null;

export const getWhitelabelInternalPath = ({
  daoId,
  pathname,
}: {
  daoId: DaoIdEnum;
  pathname: string;
}) => {
  const daoSlug = daoId.toLowerCase();
  const normalizedPathname =
    pathname === "/" ? "/" : pathname.replace(/\/+$/, "");

  const candidates = [
    `/${daoSlug}`,
    "/",
    `/${WHITELABEL_ROUTES.proposals}`,
    `/${WHITELABEL_ROUTES.delegates}`,
    `/${WHITELABEL_ROUTES.holdersAndDelegates}`,
    `/${WHITELABEL_ROUTES.activityFeed}`,
    `/${WHITELABEL_ROUTES.serviceProviders}`,
    `/${WHITELABEL_ROUTES.notifications}`,
    `/${WHITELABEL_ROUTES.governanceSettings}`,
    `/${WHITELABEL_ROUTES.sppAccountability}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.proposals}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.delegates}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.holdersAndDelegates}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.activityFeed}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.serviceProviders}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.notifications}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.governanceSettings}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.sppAccountability}`,
  ];

  const matchedCandidate = candidates.find(
    (candidate) =>
      normalizedPathname === candidate ||
      normalizedPathname.startsWith(`${candidate}/`),
  );

  if (!matchedCandidate) {
    return null;
  }

  if (normalizedPathname === "/" || normalizedPathname === `/${daoSlug}`) {
    return `/whitelabel/${daoSlug}`;
  }

  const strippedPathname = normalizedPathname.startsWith(`/${daoSlug}/`)
    ? normalizedPathname.slice(daoSlug.length + 1)
    : normalizedPathname;

  return `/whitelabel/${daoSlug}${strippedPathname}`;
};
