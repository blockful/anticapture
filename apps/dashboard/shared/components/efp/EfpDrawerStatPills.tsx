"use client";

import type { Address } from "viem";

import { BadgeStatus } from "@/shared/components/design-system/badges";
import { EfpIcon } from "@/shared/components/icons/EfpIcon";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import {
  formatEfpDrawerStatsLabel,
  getEfpProfileUrl,
  type EfpStats,
} from "@/shared/utils/efp";
import { useGetAddress } from "@anticapture/client/hooks";

type EfpDrawerStatPillsProps = {
  address: Address;
};

export const EfpDrawerStatPills = ({ address }: EfpDrawerStatPillsProps) => {
  const { data, isLoading } = useGetAddress(address, {
    query: { enabled: !!address },
  });
  const efp: EfpStats = data?.efp ?? null;
  const profileUrl = getEfpProfileUrl(address, data?.ens?.name);

  if (isLoading) {
    return (
      <SkeletonRow
        parentClassName="flex animate-pulse"
        className="h-5 w-36 rounded-full"
      />
    );
  }

  if (!efp) {
    return null;
  }

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-80"
    >
      <BadgeStatus variant="secondary" className="cursor-pointer pl-1">
        <span className="size-3 shrink-0 overflow-hidden rounded-md">
          <EfpIcon className="size-full" />
        </span>
        {formatEfpDrawerStatsLabel(efp)}
      </BadgeStatus>
    </a>
  );
};
