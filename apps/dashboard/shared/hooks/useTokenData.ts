import { DaoIdEnum } from "@/shared/types/daos";
import {
  QueryInput_Token_Currency,
  useGetTokenQuery,
} from "@anticapture/graphql-client/hooks";

/**
 * GQL Hook to fetch and manage delegated token property data
 * @param daoId The DAO ID to fetch data for
 * @param currency Currency in which the token prive will be evaluated (optional; defaults to "usd")
 * @returns GQL response with delegated supply data
 */
export const useTokenData = (
  daoId: DaoIdEnum,
  currency: "usd" | "eth" = "usd",
) => {
  return useGetTokenQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    variables: {
      currency: currency as QueryInput_Token_Currency,
    },
  });
};
