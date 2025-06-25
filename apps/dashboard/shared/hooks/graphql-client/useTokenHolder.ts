import {
  PageInfo,
  useGetTopTokenHoldersQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

interface TokenHolder {
  accountId: string;
  balance: string;
  daoId: string;
  delegate: string;
  id: string;
  tokenId: string;
  account: {
    type: string;
  };
}

interface UseTokenHolderResult {
  data: TokenHolder[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  pageInfo: PageInfo | null;
  fetchMore: (cursor: string, direction: "forward" | "backward") => void;
}

export const useTokenHolder = (daoId: DaoIdEnum): UseTokenHolderResult => {
  const { data, loading, error, refetch, fetchMore } =
    useGetTopTokenHoldersQuery({
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
    data: data?.accountBalances?.items as TokenHolder[] | null,
    loading,
    error: error || null,
    refetch,
    pageInfo: data?.accountBalances?.pageInfo || null,
    fetchMore: handleFetchMore,
  };
};
