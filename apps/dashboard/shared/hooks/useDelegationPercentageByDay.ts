import { useGetDelegatedSupplyHistoryQuery } from "@anticapture/graphql-client/hooks";

interface DelegationPercentageItem {
  date: string;
  high: string;
}

interface UseDelegationPercentageByDayResult {
  data: DelegationPercentageItem[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDelegationPercentageByDay = (
  startDate: string,
  endDate?: string,
): UseDelegationPercentageByDayResult => {
  const { data, loading, error, refetch } = useGetDelegatedSupplyHistoryQuery({
    variables: {
      startDate,
      endDate,
    },
  });

  return {
    data:
      (data?.averageDelegationPercentageByDay?.items as
        | DelegationPercentageItem[]
        | null) || null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
