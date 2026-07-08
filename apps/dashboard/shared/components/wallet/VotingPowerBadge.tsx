"use client";

import { Skeleton } from "@/shared/components/design-system/skeleton/Skeleton";
import { useConnectedWalletVotingPower } from "@/shared/hooks/useConnectedWalletVotingPower";

export const VotingPowerBadge = () => {
  const { votingPower, isLoading } = useConnectedWalletVotingPower();

  if (isLoading) {
    return <Skeleton className="h-4 w-16" parentClassName="flex" />;
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
