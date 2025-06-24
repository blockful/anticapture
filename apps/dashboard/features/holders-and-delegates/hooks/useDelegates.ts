import {
  useGetDelegatesQuery,
  useGetHistoricalVotingAndActivityQuery,
} from "@anticapture/graphql-client/hooks";
import {
  QueryInput_HistoricalVotingPower_DaoId,
  QueryInput_ProposalsActivity_DaoId,
} from "@anticapture/graphql-client";
import { useMemo } from "react";

interface ProposalsActivity {
  totalProposals: number;
  votedProposals: number;
  neverVoted: number;
}

interface Delegate {
  votingPower: any;
  delegationsCount: number;
  account?: {
    type: string;
    id: string;
  } | null;
  proposalsActivity?: ProposalsActivity;
}

interface UseDelegatesResult {
  data: Delegate[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDelegates = (): UseDelegatesResult => {
  const {
    data: delegatesData,
    loading: delegatesLoading,
    error: delegatesError,
    refetch,
  } = useGetDelegatesQuery({
    context: {
      headers: {
        "anticapture-dao-id": "ENS",
      },
    },
  });

  const delegateAddresses = useMemo(() => {
    return (
      delegatesData?.accountPowers?.items
        ?.map((delegate) => delegate?.account?.id)
        .filter(Boolean) || []
    );
  }, [delegatesData]);

  const {
    data: activityData,
    loading: activityLoading,
    error: activityError,
  } = useGetHistoricalVotingAndActivityQuery({
    variables: {
      addresses: delegateAddresses,
      address:
        delegateAddresses[0] || "0x0000000000000000000000000000000000000000",
      blockNumber: 20161841,
      daoId: QueryInput_HistoricalVotingPower_DaoId.Ens,
      proposalsDaoId: QueryInput_ProposalsActivity_DaoId.Ens,
      fromDate: 1672531200,
    },
    context: {
      headers: {
        "anticapture-dao-id": "ENS",
      },
    },
    skip: delegateAddresses.length === 0,
  });

  const enrichedData = useMemo(() => {
    if (!delegatesData?.accountPowers?.items) return null;

    return delegatesData.accountPowers.items.map((delegate) => {
      const proposalsActivity = activityData?.proposalsActivity
        ? {
            totalProposals: activityData.proposalsActivity.totalProposals,
            votedProposals: activityData.proposalsActivity.votedProposals,
            neverVoted: activityData.proposalsActivity.neverVoted ? 1 : 0,
          }
        : undefined;

      return {
        ...delegate,
        proposalsActivity,
      };
    });
  }, [delegatesData, activityData]);

  return {
    data: enrichedData,
    loading: delegatesLoading || activityLoading,
    error: delegatesError || activityError || null,
    refetch,
  };
};
