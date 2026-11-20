import { isAddress } from "viem";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import type { DaoIdEnum } from "@/shared/types/daos";
import { toDaoIdEnum } from "@/shared/types/daos";

export const WHITELABEL_ROUTES = {
  proposals: "proposals",
  delegates: "delegates",
  stakeholders: "stakeholders",
  holdersAndDelegates: "holders-and-delegates",
  activityFeed: "activity-feed",
  serviceProviders: "service-providers",
  revenue: "revenue",
  notifications: "notifications",
  governanceSettings: "governance-settings",
  sppAccountability: "spp-accountability",
  address: "address",
} as const;

export type WhitelabelRouteSlug =
  (typeof WHITELABEL_ROUTES)[keyof typeof WHITELABEL_ROUTES];

const NORMALIZED_HOSTNAME_TO_DAO_ID = Object.entries(daoConfigByDaoId).reduce(
  (acc, [daoId, daoConfig]) => {
    daoConfig.hostnames?.forEach((hostname) => {
      acc[hostname.toLowerCase()] = daoId as DaoIdEnum;
    });

    return acc;
  },
  {} as Record<string, DaoIdEnum>,
);

export const resolveDaoIdFromHostname = (hostname: string): DaoIdEnum | null =>
  NORMALIZED_HOSTNAME_TO_DAO_ID[hostname.toLowerCase()] ?? null;

export const resolveWhitelabelDaoIdFromHeaders = (
  requestHeaders: Headers,
): DaoIdEnum | null => {
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  return resolveDaoIdFromHostname(host.split(":")[0]);
};

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
  // Match case-insensitively: routes like /ENS/... must resolve the same as
  // /ens/..., otherwise basePath falls through to "" and whitelabel daos emit
  // a dao-less /proposals/{id} path that 404s on the main domain.
  const normalizedPathname = (
    pathname.startsWith("/") ? pathname : `/${pathname}`
  ).toLowerCase();
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

  // Normal dashboard: /[daoId]/proposals/[proposalId]
  const daoSlug = daoId.toLowerCase();
  return isOffchain
    ? `/${daoSlug}/proposals/${proposalId}?proposalType=offchain`
    : `/${daoSlug}/proposals/${proposalId}`;
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
  const sourceQuery = isOffchain ? "?source=snapshot" : "";

  if (basePath.startsWith("/whitelabel/")) {
    return `${basePath}/${WHITELABEL_ROUTES.proposals}${sourceQuery}`;
  }

  if (basePath === "" && isWhitelabelDao(daoConfigByDaoId[daoId])) {
    return `/${WHITELABEL_ROUTES.proposals}${sourceQuery}`;
  }

  return `/${daoId.toLowerCase()}/proposals${sourceQuery}`;
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

  return "/alerts";
};

/**
 * Path of an address profile inside the DAO, for whichever shell the current
 * page belongs to: `/{dao}/address/{address}` on the main app,
 * `/whitelabel/{dao}/address/{address}` on the internal whitelabel path and
 * `/address/{address}` on a whitelabel domain.
 */
export const getDaoAddressPath = ({
  daoId,
  pathname,
  address,
}: {
  daoId: DaoIdEnum;
  pathname: string;
  address: string;
}) => {
  const basePath = getWhitelabelBasePath({ daoId, pathname });
  const addressRoute = `${WHITELABEL_ROUTES.address}/${address}`;

  if (basePath.startsWith("/whitelabel/")) {
    return `${basePath}/${addressRoute}`;
  }

  // External whitelabel domain: middleware rewrites the path, so pathname
  // doesn't include the daoId prefix (basePath is "")
  if (basePath === "" && isWhitelabelDao(daoConfigByDaoId[daoId])) {
    return `/${addressRoute}`;
  }

  return `/${daoId.toLowerCase()}/${addressRoute}`;
};

/**
 * Where a URL from before the profile page existed should land. The profile
 * used to be a drawer opened by `?drawerAddress=0x…` on the holders and
 * delegates pages, and the whitelabel had a `delegates/{address}` route that
 * only opened that drawer. Returns null when the URL is not one of those.
 *
 * `whitelabelDaoId` is the DAO resolved from the request host: on a whitelabel
 * domain the visible path carries no DAO prefix.
 */
export const getLegacyProfileRedirectPath = ({
  pathname,
  searchParams,
  whitelabelDaoId,
}: {
  pathname: string;
  searchParams: URLSearchParams;
  whitelabelDaoId: DaoIdEnum | null;
}): string | null => {
  const segments = pathname.split("/").filter(Boolean);
  const drawerAddress = searchParams.get("drawerAddress");
  const delegatesIndex = segments.indexOf(WHITELABEL_ROUTES.delegates);
  const delegateRouteAddress =
    delegatesIndex >= 0 && delegatesIndex === segments.length - 2
      ? segments[delegatesIndex + 1]
      : null;

  const address = [drawerAddress, delegateRouteAddress].find(
    (candidate): candidate is string =>
      !!candidate && isAddress(candidate, { strict: false }),
  );

  if (!address) return null;

  const addressRoute = `${WHITELABEL_ROUTES.address}/${address}`;

  if (whitelabelDaoId) return `/${addressRoute}`;

  if (segments[0] === "whitelabel" && segments[1]) {
    const daoId = toDaoIdEnum(segments[1]);
    return daoId ? `/whitelabel/${daoId.toLowerCase()}/${addressRoute}` : null;
  }

  const daoId = segments[0] ? toDaoIdEnum(segments[0]) : null;
  return daoId ? `/${daoId.toLowerCase()}/${addressRoute}` : null;
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
    `/${WHITELABEL_ROUTES.stakeholders}`,
    `/${WHITELABEL_ROUTES.holdersAndDelegates}`,
    `/${WHITELABEL_ROUTES.activityFeed}`,
    `/${WHITELABEL_ROUTES.serviceProviders}`,
    `/${WHITELABEL_ROUTES.revenue}`,
    `/${WHITELABEL_ROUTES.notifications}`,
    `/${WHITELABEL_ROUTES.governanceSettings}`,
    `/${WHITELABEL_ROUTES.sppAccountability}`,
    `/${WHITELABEL_ROUTES.address}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.proposals}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.delegates}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.stakeholders}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.holdersAndDelegates}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.activityFeed}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.serviceProviders}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.revenue}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.notifications}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.governanceSettings}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.sppAccountability}`,
    `/${daoSlug}/${WHITELABEL_ROUTES.address}`,
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
