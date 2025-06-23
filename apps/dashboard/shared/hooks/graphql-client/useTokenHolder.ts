import { useGetTopTokenHoldersQuery } from "@anticapture/graphql-client/hooks";
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
}

export const useTokenHolder = (daoId: DaoIdEnum): UseTokenHolderResult => {
  const { data, loading, error, refetch } = useGetTopTokenHoldersQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  return {
    data: data?.accountBalances?.items as TokenHolder[] | null,
    loading,
    error: error || null,
    refetch: () => refetch(),
  };
};
