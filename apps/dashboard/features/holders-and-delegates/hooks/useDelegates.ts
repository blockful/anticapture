import { useGetDelegatesQuery } from "@anticapture/graphql-client/hooks";

interface Delegate {
  votingPower: any;
  account?: {
    type: string;
    id: string;
  } | null;
}

interface UseDelegatesResult {
  data: Delegate[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useDelegates = (): UseDelegatesResult => {
  const { data, loading, error, refetch } = useGetDelegatesQuery({
    context: {
      headers: {
        "anticapture-dao-id": "ENS",
      },
    },
  });

  return {
    data: data?.accountPowers?.items || null,
    loading,
    error: error || null,
    refetch,
  };
};
