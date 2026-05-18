import type {
  VotingPower,
  VotingPowerByAccountIdPathParamsDaoEnumKey,
  VotesByProposalIdPathParamsDaoEnumKey,
  VotesByProposalIdQueryResponse,
} from "@anticapture/client";
import {
  useVotingPowerByAccountId,
  useVotesByProposalId,
} from "@anticapture/client/hooks";
import { formatUnits } from "viem";

import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";

export interface AccountPowerData {
  accountPower: VotingPower | null;
  votingPower: string;
  rawVotingPower: string;
  votes: VotesByProposalIdQueryResponse | null;
  hasVoted: boolean;
}

export interface UseAccountPowerResult {
  data: AccountPowerData;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseAccountPowerParams {
  address: string;
  daoId: DaoIdEnum;
  proposalId: string;
  decimals: number;
}

const EMPTY_ACCOUNT_POWER_DATA: AccountPowerData = {
  accountPower: null,
  votingPower: "0",
  rawVotingPower: "0",
  votes: null,
  hasVoted: false,
};

export const useAccountPower = ({
  address,
  daoId,
  proposalId,
  decimals,
}: UseAccountPowerParams): UseAccountPowerResult => {
  const votingPowerDaoKey =
    daoId.toLowerCase() as VotingPowerByAccountIdPathParamsDaoEnumKey;
  const votesDaoKey =
    daoId.toLowerCase() as VotesByProposalIdPathParamsDaoEnumKey;

  const votingPowerQuery = useVotingPowerByAccountId(
    votingPowerDaoKey,
    address,
    undefined,
    {
      query: {
        enabled: !!address,
      },
    },
  );

  const votesQuery = useVotesByProposalId(
    votesDaoKey,
    proposalId,
    {
      limit: 1,
      voterAddressIn: address ? [address] : undefined,
    },
    {
      query: {
        enabled: !!address && !!proposalId,
      },
    },
  );

  const refetch = () => {
    void votingPowerQuery.refetch();
    void votesQuery.refetch();
  };

  if (!votingPowerQuery.data) {
    return {
      data: EMPTY_ACCOUNT_POWER_DATA,
      isLoading: votingPowerQuery.isLoading || votesQuery.isLoading,
      error:
        votingPowerQuery.error instanceof Error
          ? votingPowerQuery.error
          : votesQuery.error instanceof Error
            ? votesQuery.error
            : null,
      refetch,
    };
  }

  const rawVotingPower = votingPowerQuery.data.votingPower.toString();

  return {
    data: {
      accountPower: votingPowerQuery.data,
      votingPower: formatNumberUserReadable(
        Number(formatUnits(votingPowerQuery.data.votingPower, decimals)),
      ),
      rawVotingPower,
      votes: votesQuery.data ?? null,
      hasVoted: (votesQuery.data?.items.length ?? 0) > 0,
    },
    isLoading: votingPowerQuery.isLoading || votesQuery.isLoading,
    error:
      votingPowerQuery.error instanceof Error
        ? votingPowerQuery.error
        : votesQuery.error instanceof Error
          ? votesQuery.error
          : null,
    refetch,
  };
};
