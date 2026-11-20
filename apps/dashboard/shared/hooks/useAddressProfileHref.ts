"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { getAddress, isAddress, zeroAddress } from "viem";

import { useOptionalDaoId } from "@/shared/providers/DaoIdProvider";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getDaoAddressPath } from "@/shared/utils/whitelabel";

const getAddressProfileHref = ({
  address,
  daoId,
  pathname,
}: {
  address: string | null | undefined;
  daoId: DaoIdEnum | null;
  pathname: string;
}): string | null => {
  if (!address || !daoId) return null;
  if (!isAddress(address, { strict: false })) return null;
  if (address.toLowerCase() === zeroAddress) return null;

  return getDaoAddressPath({
    daoId,
    pathname,
    // One spelling per profile, whatever casing the API returned.
    address: getAddress(address),
  });
};

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

  return getAddressProfileHref({
    address,
    daoId: daoId ?? contextDaoId,
    pathname,
  });
};

/**
 * Navigates to an address profile, for surfaces where the whole row, bar or
 * card is the click target. The address itself should still render through
 * `AddressLink`, which gives keyboard and new-tab access.
 */
export const useOpenAddressProfile = (daoId?: DaoIdEnum) => {
  const contextDaoId = useOptionalDaoId();
  const pathname = usePathname();
  const router = useRouter();
  const resolvedDaoId = daoId ?? contextDaoId;

  return useCallback(
    (address: string) => {
      const href = getAddressProfileHref({
        address,
        daoId: resolvedDaoId,
        pathname,
      });
      if (href) router.push(href);
    },
    [resolvedDaoId, pathname, router],
  );
};
