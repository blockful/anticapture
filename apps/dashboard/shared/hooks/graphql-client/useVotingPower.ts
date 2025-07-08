import { useGetVotingPowerQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

export const useVotingPower = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: string;
}) => {
  const { data, loading, error, refetch, fetchMore } = useGetVotingPowerQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      address: address,
    },
  });

  const { data: countingData } = useGetVotingPowerQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      address: address,
    },
  });

  const handleFetchMore = (
    cursor: string,
    direction: "forward" | "backward",
  ) => {
    if (direction === "forward") {
      fetchMore({
        variables: { after: cursor },
        updateQuery: (prev, { fetchMoreResult }) => {
          return fetchMoreResult || prev;
        },
      });
    } else {
      fetchMore({
        variables: { before: cursor },
        updateQuery: (prev, { fetchMoreResult }) => {
          return fetchMoreResult || prev;
        },
      });
    }
  };

  return {
    data: data?.accountBalances?.items,
    loading,
    error,
    refetch,
    pageInfo: data?.accountBalances?.pageInfo,
    fetchMore: handleFetchMore,
  };
};
