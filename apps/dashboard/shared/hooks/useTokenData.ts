import type { QueryInput_Token_Currency } from "@anticapture/graphql-client";
import {
  type TokenDataQuery,
  useTokenDataQuery,
} from "@anticapture/graphql-client/hooks";

import type { DaoIdEnum } from "@/shared/types/daos";

type TokenProperties = Extract<
  NonNullable<TokenDataQuery["token"]>,
  { __typename?: "TokenPropertiesResponse" }
>;

export type TokenDataResponse = TokenProperties;

export const useTokenData = (
  daoId: DaoIdEnum,
  currency: "usd" | "eth" = "usd",
) => {
  const { data, loading, error, refetch } = useTokenDataQuery({
    variables: {
      currency: currency as QueryInput_Token_Currency | undefined,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !daoId || !currency,
    fetchPolicy: "no-cache",
  });

  const token =
    data?.token?.__typename === "TokenPropertiesResponse"
      ? (data.token as TokenProperties)
      : null;

  return {
    data: token,
    isLoading: loading,
    error: error || null,
    mutate: refetch,
  };
};
