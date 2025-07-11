import {
  useGetDelegationsTimestampQuery,
  useGetDelegatorVotingPowerDetailsQuery,
} from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";

interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  endCursor?: string | null;
  startCursor?: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  currentItemsCount: number;
}

export const useVotingPower = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: string;
}) => {
  const {
    data: delegatorsVotingPowerDetails, // Here i have the accountBalances Id
    loading,
    error,
    refetch,
    fetchMore,
  } = useGetDelegatorVotingPowerDetailsQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      address: address,
    },
  });
  console.log("delegatorsVotingPowerDetails2121", delegatorsVotingPowerDetails);
  const accountBalances = delegatorsVotingPowerDetails?.accountBalances?.items;

  // ------------------------------------------------------------------
  // Prepare the array of delegator addresses once balances are fetched
  // ------------------------------------------------------------------
  const delegatorAddresses: string[] = accountBalances
    ? accountBalances.map((item) => item.accountId)
    : [];

  console.log("delegatorAddress221", delegatorAddresses);

  // ------------------------------------------------------------------
  // Fetch delegation timestamps (skipped until we have delegatorAddresses)
  // ------------------------------------------------------------------
  const {
    data: delegationsTimestampData,
    loading: tsLoading,
    error: tsError,
  } = useGetDelegationsTimestampQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      delegate: address,
      delegator: delegatorAddresses,
      daoId: daoId,
    },
    skip: delegatorAddresses.length === 0,
  });

  // ------------------------------------------------------------------
  // Build timestamp lookup <delegatorAccountId> -> timestamp
  // ------------------------------------------------------------------
  const timestampMap: Record<string, string | number | undefined> =
    Object.fromEntries(
      (delegationsTimestampData?.delegations.items || []).map((d) => [
        d.delegatorAccountId?.toLowerCase(),
        d.timestamp,
      ]),
    );

  // ------------------------------------------------------------------
  // Enrich balances with timestamp (fallback to undefined)
  // ------------------------------------------------------------------
  const balancesWithTimestamp = (accountBalances || []).map((ab) => ({
    ...ab,
    timestamp: timestampMap[ab.accountId.toLowerCase()],
  }));

  console.log("delegationsTimestampData", delegationsTimestampData);

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

  // // Fetch next page function
  // const fetchNextPage = useCallback(async () => {
  //   if (
  //     !pagination.hasNextPage ||
  //     !pagination.endCursor ||
  //     isPaginationLoading
  //   ) {
  //     console.warn("No next page available or already loading");
  //     return;
  //   }

  //   setIsPaginationLoading(true);

  //   try {
  //     await fetchMore({
  //       variables: {
  //         after: pagination.endCursor,
  //         before: undefined,
  //         orderBy,
  //         orderDirection,
  //       },
  //       updateQuery: (previousResult, { fetchMoreResult }) => {
  //         if (!fetchMoreResult) return previousResult;

  //         // Replace the current data with the new page data
  //         return {
  //           ...fetchMoreResult,
  //           accountPowers: {
  //             ...fetchMoreResult.accountPowers,
  //             items: fetchMoreResult.accountPowers.items,
  //           },
  //         };
  //       },
  //     });

  //     // Update page number after successful fetch
  //     setCurrentPage((prev) => prev + 1);
  //   } catch (error) {
  //     console.error("Error fetching next page:", error);
  //   } finally {
  //     setIsPaginationLoading(false);
  //   }
  // }, [
  //   fetchMore,
  //   pagination.hasNextPage,
  //   pagination.endCursor,
  //   orderBy,
  //   orderDirection,
  //   isPaginationLoading,
  // ]);

  // // Fetch previous page function
  // const fetchPreviousPage = useCallback(async () => {
  //   if (
  //     !pagination.hasPreviousPage ||
  //     !pagination.startCursor ||
  //     isPaginationLoading
  //   ) {
  //     console.warn("No previous page available or already loading");
  //     return;
  //   }

  //   setIsPaginationLoading(true);

  //   try {
  //     await fetchMore({
  //       variables: {
  //         after: undefined,
  //         before: pagination.startCursor,
  //         orderBy,
  //         orderDirection,
  //       },
  //       updateQuery: (previousResult, { fetchMoreResult }) => {
  //         if (!fetchMoreResult) return previousResult;

  //         // Replace the current data with the new page data
  //         return {
  //           ...fetchMoreResult,
  //           accountPowers: {
  //             ...fetchMoreResult.accountPowers,
  //             items: fetchMoreResult.accountPowers.items,
  //           },
  //         };
  //       },
  //     });

  //     // Update page number after successful fetch
  //     setCurrentPage((prev) => prev - 1);
  //   } catch (error) {
  //     console.error("Error fetching previous page:", error);
  //   } finally {
  //     setIsPaginationLoading(false);
  //   }
  // }, [
  //   fetchMore,
  //   pagination.hasPreviousPage,
  //   pagination.startCursor,
  //   orderBy,
  //   orderDirection,
  //   isPaginationLoading,
  // ]);

  // // Enhanced refetch that resets pagination
  // const handleRefetch = useCallback(() => {
  //   setCurrentPage(1);
  //   refetch();
  // }, [refetch]);

  return {
    delegatorsVotingPowerDetails,
    votingPowerHistoryData: delegationsTimestampData?.delegations.items || [],
    balances: balancesWithTimestamp,
    loading: loading || tsLoading,
    error: error || tsError,
    refetch,
    pageInfo: delegatorsVotingPowerDetails?.accountBalances?.pageInfo,
    fetchMore: handleFetchMore,
  };
};
