import type { QueryInput_Token_Currency } from "@anticapture/graphql-client";
import type { TokenInfoQuery } from "@anticapture/graphql-client/hooks";
import { useTokenInfoQuery } from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

interface UseTokenInfoResult {
  data: TokenInfoQuery["token"] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useTokenInfo = (
  daoId: DaoIdEnum,
  currency: "usd" | "eth" = "usd",
): UseTokenInfoResult => {
  const { data, loading, error, refetch } = useTokenInfoQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
    variables: {
      currency: currency as QueryInput_Token_Currency | undefined,
    },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  return {
    data: data?.token || null,
    loading,
    error: error || null,
    refetch,
  };
};
