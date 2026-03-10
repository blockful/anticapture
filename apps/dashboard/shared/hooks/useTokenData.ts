import axios from "axios";
import type { SWRConfiguration } from "swr";
import useSWR from "swr";
import type { Address } from "viem";

import type { DaoIdEnum } from "@/shared/types/daos";
import { BACKEND_ENDPOINT, getAuthHeaders } from "@/shared/utils/server-utils";

export interface TokenDataResponse {
  id: Address;
  name: DaoIdEnum;
  decimals: number;
  cexSupply: string;
  circulatingSupply: string;
  delegatedSupply: string;
  dexSupply: string;
  lendingSupply: string;
  price: number;
  totalSupply: string;
  treasury: string;
}

/* Fetch Token Property Data */
export const fetchTokenData = async ({
  daoId,
  currency,
}: {
  daoId: DaoIdEnum;
  currency: "usd" | "eth";
}): Promise<TokenDataResponse | null> => {
  const query = `query GetToken {
  token(currency: ${currency}) {
    cexSupply
    circulatingSupply
    decimals
    delegatedSupply
    dexSupply
    id
    lendingSupply
    name
    price
    totalSupply
    treasury
  }
}`;
  const response: {
    data: { data: { token: TokenDataResponse } };
  } = await axios.post(
    `${BACKEND_ENDPOINT}`,
    {
      query,
    },
    {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
  );

  return response.data.data.token;
};

/**
 * SWR hook to fetch and manage delegated token property data
 * @param daoId The DAO ID to fetch data for
 * @param currency Currency in which the token prive will be evaluated (optional; defaults to "usd")
 * @returns SWR response with delegated supply data
 */
export const useTokenData = (
  daoId: DaoIdEnum,
  currency: "usd" | "eth" = "usd",
  config?: Partial<SWRConfiguration<TokenDataResponse | null, Error>>,
) => {
  const key = daoId && currency ? [`delegatedSupply`, daoId, currency] : null;

  return useSWR<TokenDataResponse | null>(
    key,
    async () => {
      return await fetchTokenData({ daoId, currency });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
