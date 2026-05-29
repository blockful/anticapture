import { useAverageDelegationPercentage } from "@anticapture/client/hooks";

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

const DELEGATION_HISTORY_LIMIT = 365;

export const useDelegationPercentageByDay = (
  startDate: number,
  endDate?: number,
): UseDelegationPercentageByDayResult => {
  const { data, isLoading, error, refetch } = useAverageDelegationPercentage({
    startDate,
    endDate,
    limit: DELEGATION_HISTORY_LIMIT,
  });

  return {
    data: data?.items ?? null,
    loading: isLoading,
    error: error instanceof Error ? error : null,
    refetch: () => {
      refetch();
    },
  };
};
