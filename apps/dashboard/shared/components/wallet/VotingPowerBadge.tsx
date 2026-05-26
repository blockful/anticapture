"use client";

import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { useConnectedWalletVotingPower } from "@/shared/hooks/useConnectedWalletVotingPower";

export const VotingPowerBadge = () => {
  const { votingPower, loading } = useConnectedWalletVotingPower();

  if (loading) {
    return <SkeletonRow className="h-4 w-16" parentClassName="flex" />;
  }

  if (!votingPower) {
    return null;
  }

  return (
    <span className="text-secondary whitespace-nowrap text-sm font-medium">
      {votingPower} VP
    </span>
  );
};
