"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { useDelegateAddressesForDao } from "@/features/holders-and-delegates/hooks/useDelegateAddressesForDao";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  formatEfpCounts,
  formatEfpIdentityLabel,
} from "@/shared/utils/formatEfp";
import { getDaoPagePath, WHITELABEL_ROUTES } from "@/shared/utils/whitelabel";
import { postEfpFollowingInSet } from "@anticapture/client";
import type { PostEfpFollowingInSetMutationRequest } from "@anticapture/client";
import { useGetAddress } from "@anticapture/client/hooks";
import { useQuery } from "@tanstack/react-query";

const MAX_DISPLAYED_FOLLOWS = 20;

interface DelegateEfpSocialContextProps {
  daoId: DaoIdEnum;
  delegateAddress: Address;
}

export const DelegateEfpSocialContext = ({
  daoId,
  delegateAddress,
}: DelegateEfpSocialContextProps) => {
  const pathname = usePathname();
  const { address: viewerAddress, isConnected } = useAccount();
  const { data: delegateEnrichment, isLoading: isEfpLoading } = useGetAddress(
    delegateAddress,
    {
      query: { enabled: !!delegateAddress },
    },
  );
  const efp = delegateEnrichment?.efp ?? null;

  const { delegateAddresses, isLoading: isDelegatesLoading } =
    useDelegateAddressesForDao(daoId, delegateAddress, isConnected);

  const followingInSetRequest = useMemo(():
    | PostEfpFollowingInSetMutationRequest
    | undefined => {
    if (
      isDelegatesLoading ||
      !viewerAddress ||
      delegateAddresses.length === 0
    ) {
      return undefined;
    }

    return {
      viewer:
        viewerAddress.toLowerCase() as PostEfpFollowingInSetMutationRequest["viewer"],
      addresses:
        delegateAddresses as PostEfpFollowingInSetMutationRequest["addresses"],
    };
  }, [isDelegatesLoading, viewerAddress, delegateAddresses]);

  const {
    data: followingInSetData,
    isLoading: isFollowingInSetLoading,
    isError: isFollowingInSetError,
  } = useQuery({
    queryKey: [
      "efp-following-in-set",
      viewerAddress,
      delegateAddresses,
    ] as const,
    queryFn: () => postEfpFollowingInSet(followingInSetRequest!),
    enabled: !!followingInSetRequest && !isDelegatesLoading,
    staleTime: 5 * 60 * 1000,
  });

  const followedDelegates = followingInSetData?.followed ?? [];
  const displayedFollowed = followedDelegates.slice(0, MAX_DISPLAYED_FOLLOWS);
  const hiddenFollowedCount = Math.max(
    0,
    followedDelegates.length - MAX_DISPLAYED_FOLLOWS,
  );

  const countsLabel = formatEfpCounts(efp);
  const delegatesBasePath = getDaoPagePath({
    daoId,
    pathname,
    page: WHITELABEL_ROUTES.delegates,
  });

  return (
    <section className="border-border-contrast mb-6 flex flex-col gap-4 border-b border-dashed pb-6">
      <div className="flex flex-col gap-1">
        <span className="text-secondary text-xs font-medium uppercase tracking-wide">
          EFP
        </span>
        {isEfpLoading ? (
          <span className="text-secondary text-sm leading-5">Loading…</span>
        ) : countsLabel ? (
          <span className="text-primary text-2xl font-medium leading-8">
            {countsLabel}
          </span>
        ) : (
          <span className="text-secondary text-sm leading-5">Not informed</span>
        )}
        <span className="text-secondary text-xs leading-4">
          {formatEfpIdentityLabel()}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-secondary text-xs font-medium leading-4">
          Delegates you follow
        </span>

        {!isConnected ? (
          <span className="text-secondary text-sm leading-5">
            Connect wallet to see delegates you follow
          </span>
        ) : isDelegatesLoading || isFollowingInSetLoading ? (
          <span className="text-secondary text-sm leading-5">Loading…</span>
        ) : isFollowingInSetError ? (
          <span className="text-secondary text-sm leading-5">Not informed</span>
        ) : followedDelegates.length === 0 ? (
          <span className="text-secondary text-sm leading-5">
            You don&apos;t follow other delegates in this DAO
          </span>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedFollowed.map((address) => (
              <Link
                key={address}
                href={`${delegatesBasePath}/${address}`}
                className="hover:opacity-80"
              >
                <EnsAvatar address={address as Address} size="sm" />
              </Link>
            ))}
            {hiddenFollowedCount > 0 && (
              <span className="text-secondary text-sm leading-5">
                +{hiddenFollowedCount} more
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
