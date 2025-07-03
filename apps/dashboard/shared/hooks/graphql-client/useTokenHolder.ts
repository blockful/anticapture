import {
  useGetTopTokenHoldersQuery,
  useGetTokenHoldersCoutingQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

export const useTokenHolder = ({
  daoId,
  limit,
  orderDirection,
}: {
  daoId: DaoIdEnum;
  limit: number;
  orderDirection: "desc" | "asc";
}) => {
  const { data, loading, error, refetch, fetchMore } =
    useGetTopTokenHoldersQuery({
      context: {
        headers: {
          "anticapture-dao-id": daoId,
        },
      },
      variables: {
        limit: limit,
        orderDirection: orderDirection,
      },
    });

  const { data: countingData } = useGetTokenHoldersCoutingQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
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
    totalCount: countingData?.accountBalances.totalCount,
    loading,
    error,
    refetch,
    pageInfo: data?.accountBalances?.pageInfo,
    fetchMore: handleFetchMore,
  };
};
