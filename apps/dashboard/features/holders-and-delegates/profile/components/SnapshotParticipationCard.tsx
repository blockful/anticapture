"use client";

import { Vote } from "lucide-react";
import type { Address } from "viem";

import { useSnapshotParticipation } from "@/features/holders-and-delegates/profile/hooks/useSnapshotParticipation";
import { MetricCard } from "@/shared/components/cards/MetricCard";
import type { DaoIdEnum } from "@/shared/types/daos";

const toValue = (
  participation: ReturnType<typeof useSnapshotParticipation>,
) => {
  if (participation.status === "loading") return undefined;
  if (participation.status !== "ready")
    return <span className="text-secondary">Unavailable</span>;

  const { votedProposals, eligibleProposals } = participation.value;
  const share =
    eligibleProposals > 0
      ? Math.round((votedProposals / eligibleProposals) * 100)
      : 0;
  return `Voted ${votedProposals} of ${eligibleProposals} (${share}%)`;
};

/** Snapshot counterpart of the onchain votes card, for DAOs that vote offchain. */
export const SnapshotParticipationCard = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: Address;
}) => {
  const participation = useSnapshotParticipation({ daoId, address });

  return (
    <MetricCard
      icon={<Vote className="size-3.5" />}
      title="Snapshot votes"
      value={toValue(participation)}
    />
  );
};
