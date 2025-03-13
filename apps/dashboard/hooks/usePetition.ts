import { SWRConfiguration } from "swr";

import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR from "swr";

interface PetitionResponse {
  petitionSignatures: PetitionSignature[];
  totalSignatures: number;
  totalSignaturesPower: string;
  latestVoters: string[];
  userSigned: boolean;
}

type PetitionSignature = {
  accountId: string;
  daoId: DaoIdEnum;
  timestamp: string;
  message: string;
  signature: string;
  votingPower: string | null;
};

/* Fetch Proposals */
export const fetchPetition = async ({
  daoId,
  userAddress,
}: {
  daoId: DaoIdEnum;
  userAddress?: string;
}): Promise<PetitionResponse> => {
  const response: Response = await fetch(
    `${BACKEND_ENDPOINT}/petition/${daoId}?userAddress=${userAddress || ""}`,
    { next: { revalidate: 3600 } },
  );
  return response.json();
};

/**
 * SWR hook to fetch and manage proposals data
 * @param daoId The DAO ID to fetch data for
 * @param days The number of days to compare
 * @param config Optional SWR configuration
 * @returns SWR response with proposals data
 */
export const usePetition = (
  daoId: DaoIdEnum,
  userAddress?: string,
  config?: Partial<SWRConfiguration<PetitionResponse, Error>>,
) => {
  const key = daoId && userAddress ? [`petition`, daoId, userAddress] : null;

  return useSWR<PetitionResponse>(
    key,
    async () => {
      return await fetchPetition({ daoId, userAddress });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
