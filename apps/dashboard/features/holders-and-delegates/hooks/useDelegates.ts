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
  historicalVotingPower?: string;
}

interface UseDelegatesResult {
  data: Delegate[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseDelegatesParams {
  blockNumber: number;
  fromDate: number;
  daoId: QueryInput_HistoricalVotingPower_DaoId;
}

export const useDelegates = ({
  blockNumber,
  fromDate,
  daoId,
}: UseDelegatesParams): UseDelegatesResult => {
  const {
    data: delegatesData,
    loading: delegatesLoading,
    error: delegatesError,
    refetch,
  } = useGetDelegatesQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
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
      blockNumber,
      daoId,
      proposalsDaoId: daoId as unknown as QueryInput_ProposalsActivity_DaoId,
      fromDate,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
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

      // Find historical voting power for this delegate
      const historicalVotingPowerData =
        activityData?.historicalVotingPower?.find(
          (historical) => historical?.address === delegate.account?.id,
        );

      return {
        ...delegate,
        proposalsActivity,
        historicalVotingPower: historicalVotingPowerData?.votingPower,
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
