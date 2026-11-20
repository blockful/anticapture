"use client";

import type {
  OffchainProposal,
  OffchainProposalsPathParamsDaoEnumKey,
  VotesOffchainPathParamsDaoEnumKey,
} from "@anticapture/client";
import {
  useOffchainProposals,
  useVotesOffchain,
} from "@anticapture/client/hooks";
import { useMemo } from "react";
import type { Address } from "viem";

import type { SummaryMetric } from "@/features/holders-and-delegates/profile/hooks/useAddressProfileSummary";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

// Snapshot spaces hold a few hundred proposals at most; the lean list (no
// bodies) is small enough to load once and serve every row of the tab.
const ALL_PROPOSALS_LIMIT = 1_000;
const PROPOSALS_STALE_TIME = 5 * 60 * 1000;

export interface SnapshotParticipation {
  votedProposals: number;
  /**
   * Proposals still open at or after the address's first Snapshot vote: the
   * ones it could have voted on, the same window the onchain count uses.
   */
  eligibleProposals: number;
}

const toProposalsKey = (daoId: DaoIdEnum) =>
  daoId.toLowerCase() as OffchainProposalsPathParamsDaoEnumKey;

const toVotesKey = (daoId: DaoIdEnum) =>
  daoId.toLowerCase() as VotesOffchainPathParamsDaoEnumKey;

/** Every Snapshot proposal of the DAO, by id, for labels and links. */
export const useSnapshotProposalsById = (daoId: DaoIdEnum) => {
  const hasSnapshot = Boolean(daoConfigByDaoId[daoId].offchainProposals);
  const query = useOffchainProposals(
    toProposalsKey(daoId),
    { limit: ALL_PROPOSALS_LIMIT, lean: true },
    { query: { enabled: hasSnapshot, staleTime: PROPOSALS_STALE_TIME } },
  );

  const proposalsById = useMemo(
    () =>
      new Map<string, OffchainProposal>(
        (query.data?.items ?? []).map((proposal) => [proposal.id, proposal]),
      ),
    [query.data],
  );

  return {
    proposalsById,
    proposals: query.data?.items ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
};

/** "Voted X of Y" on Snapshot, for DAOs that vote offchain. */
export const useSnapshotParticipation = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: Address;
}): SummaryMetric<SnapshotParticipation> => {
  const hasSnapshot = Boolean(daoConfigByDaoId[daoId].offchainProposals);
  const proposalsQuery = useSnapshotProposalsById(daoId);
  // Oldest first: one row gives both the first vote and the total count.
  const firstVoteQuery = useVotesOffchain(
    toVotesKey(daoId),
    { voterAddresses: [address], limit: 1, orderDirection: "asc" },
    { query: { enabled: hasSnapshot } },
  );

  if (!hasSnapshot) return { status: "unsupported" };
  if (proposalsQuery.isLoading || firstVoteQuery.isLoading) {
    return { status: "loading" };
  }
  if (!proposalsQuery.proposals || !firstVoteQuery.data) {
    return { status: "error" };
  }

  const votedProposals = firstVoteQuery.data.totalCount;
  const firstVoteAt = firstVoteQuery.data.items[0]?.created;
  const eligibleProposals =
    firstVoteAt === undefined
      ? proposalsQuery.proposals.length
      : proposalsQuery.proposals.filter(
          (proposal) => proposal.end >= firstVoteAt,
        ).length;

  return {
    status: "ready",
    value: { votedProposals, eligibleProposals },
  };
};
