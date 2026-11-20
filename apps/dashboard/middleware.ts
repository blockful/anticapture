import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ALL_DAOS } from "@/shared/types/daos";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  WHITELABEL_ROUTES,
  getLegacyProfileRedirectPath,
  getWhitelabelInternalPath,
  resolveDaoIdFromHostname,
} from "@/shared/utils/whitelabel";

const resolveForcedDao = () => {
  const forcedDao =
    process.env.NODE_ENV !== "production"
      ? process.env.FORCE_DAO?.trim().toUpperCase()
      : undefined;

  if (!forcedDao) {
    return null;
  }

  return ALL_DAOS.includes(forcedDao as DaoIdEnum)
    ? (forcedDao as DaoIdEnum)
    : null;
};

export function middleware(request: NextRequest) {
  const forcedDao = resolveForcedDao();
  const daoId = forcedDao ?? resolveDaoIdFromHostname(request.nextUrl.hostname);

  // The address profile used to be a drawer (`?drawerAddress=0x…`) and, on the
  // whitelabel, a `delegates/{address}` route. Shared links keep working by
  // landing on the profile page.
  const legacyProfilePath = getLegacyProfileRedirectPath({
    pathname: request.nextUrl.pathname,
    searchParams: request.nextUrl.searchParams,
    whitelabelDaoId: daoId,
  });

  if (legacyProfilePath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = legacyProfilePath;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (!daoId) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${WHITELABEL_ROUTES.proposals}`;
    return NextResponse.redirect(redirectUrl);
  }

  const rewrittenPathname = getWhitelabelInternalPath({
    daoId,
    pathname: request.nextUrl.pathname,
  });

  if (!rewrittenPathname) {
    return NextResponse.next();
  }

  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = rewrittenPathname;

  return NextResponse.rewrite(nextUrl);
}

export const config = {
  // Profile URLs may carry an ENS name (`/address/nick.eth`), whose dot would
  // otherwise read as a static file and skip the whitelabel rewrite.
  matcher: ["/((?!api|_next|.*\\..*).*)", "/address/:name*"],
};
