import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";
import { Address } from "viem";

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
