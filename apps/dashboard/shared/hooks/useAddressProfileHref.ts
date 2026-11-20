"use client";

import { usePathname } from "next/navigation";
import { getAddress, isAddress, zeroAddress } from "viem";

import { useOptionalDaoId } from "@/shared/providers/DaoIdProvider";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getDaoAddressPath } from "@/shared/utils/whitelabel";

/**
 * Link to an address profile in the current shell (main app, internal
 * whitelabel path or whitelabel domain). Null when there is nothing to link
 * to: no DAO in scope, a value that is not an address, or the zero address,
 * which stands for "no delegate" rather than an account.
 */
export const useAddressProfileHref = (
  address: string | null | undefined,
  daoId?: DaoIdEnum,
): string | null => {
  const contextDaoId = useOptionalDaoId();
  const pathname = usePathname();
  const resolvedDaoId = daoId ?? contextDaoId;

  if (!address || !resolvedDaoId) return null;
  if (!isAddress(address, { strict: false })) return null;
  if (address.toLowerCase() === zeroAddress) return null;

  return getDaoAddressPath({
    daoId: resolvedDaoId,
    pathname,
    // One spelling per profile, whatever casing the API returned.
    address: getAddress(address),
  });
};
