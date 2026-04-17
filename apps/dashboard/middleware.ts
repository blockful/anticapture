import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ALL_DAOS } from "@/shared/types/daos";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
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

  if (!daoId) {
    return NextResponse.next();
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
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
