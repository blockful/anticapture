import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ApolloError } from "@apollo/client";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  GetProposalNonVotersQuery,
  useGetProposalNonVotersQuery,
  QueryInput_ProposalNonVoters_OrderDirection,
} from "@anticapture/graphql-client/hooks";

// Non-voter type
export type NonVoter = NonNullable<
  GetProposalNonVotersQuery["proposalNonVoters"]
>["items"][0] & {
  isSubRow?: boolean;
};

export interface UseNonVotersResult {
  nonVoters: NonVoter[];
  totalCount: number;
  loading: boolean;
  error: ApolloError | undefined;
  // Pagination functions
  loadMore: () => Promise<void>;
  hasNextPage: boolean;
  isLoadingMore: boolean;
}

export interface UseNonVotersParams {
  daoId?: DaoIdEnum;
  proposalId?: string;
  limit?: number;
  orderDirection?: "asc" | "desc";
}

export const useNonVoters = ({
  daoId,
  proposalId,
  limit = 10,
  orderDirection = "desc",
}: UseNonVotersParams = {}): UseNonVotersResult => {
  // State for pagination
  const [allNonVoters, setAllNonVoters] = useState<NonVoter[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  // Ref to track current skip value to avoid stale closures
  const skipRef = useRef(0);

  // Build query variables - always skip: 0 for initial query
  const queryVariables = useMemo(() => {
    return {
      id: proposalId || "",
      limit,
      skip: 0,
      orderDirection:
        orderDirection === "asc"
          ? QueryInput_ProposalNonVoters_OrderDirection.Asc
          : QueryInput_ProposalNonVoters_OrderDirection.Desc,
    };
  }, [proposalId, limit, orderDirection]);

  // Main non-voters query
  const { data, loading, error, fetchMore } = useGetProposalNonVotersQuery({
    variables: queryVariables,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !proposalId,
    notifyOnNetworkStatusChange: true,
  });

  // Reset accumulated non-voters when parameters change
  useEffect(() => {
    setAllNonVoters([]);
    setIsLoadingMore(false);
    setHasInitialized(false);
    skipRef.current = 0;
  }, [orderDirection, proposalId]);

  // Initialize allNonVoters on first load ONLY
  useEffect(() => {
    if (data?.proposalNonVoters?.items && !hasInitialized) {
      const initialNonVoters = data.proposalNonVoters.items as NonVoter[];
      setAllNonVoters(initialNonVoters);
      skipRef.current = initialNonVoters.length;
      setHasInitialized(true);
    }
  }, [data?.proposalNonVoters?.items, hasInitialized]);

  // Use accumulated non-voters for pagination
  const nonVoters = allNonVoters;

  // Extract total count
  const totalCount = useMemo(() => {
    return data?.proposalNonVoters?.totalCount || 0;
  }, [data?.proposalNonVoters?.totalCount]);

  // Calculate if there's a next page
  const hasNextPage = useMemo(() => {
    return allNonVoters.length < totalCount;
  }, [allNonVoters.length, totalCount]);

  // Load more non-voters for pagination
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore || !hasInitialized) return;

    setIsLoadingMore(true);

    try {
      // Use ref to get the current skip value, avoiding stale closure issues
      const currentSkip = skipRef.current;

      const result = await fetchMore({
        variables: {
          id: proposalId || "",
          limit,
          skip: currentSkip,
          orderDirection:
            orderDirection === "asc"
              ? QueryInput_ProposalNonVoters_OrderDirection.Asc
              : QueryInput_ProposalNonVoters_OrderDirection.Desc,
        },
      });

      if (result.data?.proposalNonVoters?.items) {
        const newNonVoters = result.data.proposalNonVoters.items as NonVoter[];
        setAllNonVoters((prev) => {
          const updated = [...prev, ...newNonVoters];
          skipRef.current = updated.length;
          return updated;
        });
      }
    } catch (error) {
      console.error("Error loading more non-voters:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hasNextPage,
    isLoadingMore,
    hasInitialized,
    limit,
    fetchMore,
    proposalId,
    orderDirection,
  ]);

  return {
    nonVoters,
    totalCount,
    loading,
    error,
    loadMore,
    hasNextPage,
    isLoadingMore,
  };
};
