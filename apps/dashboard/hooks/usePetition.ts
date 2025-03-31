import { BACKEND_ENDPOINT, PETITION_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR from "swr";
import { Address, Hex } from "viem";

/**
 * Interface for a single petition signature
 */
interface PetitionSignature {
  accountId: Address;
  daoId: DaoIdEnum;
  timestamp: string;
  message: string;
  signature: string;
}

/**
 * Interface for the petition API response
 */
interface PetitionResponse {
  petitionSignatures: PetitionSignature[];
  totalSignatures: number;
  totalSignaturesPower: number;
  latestVoters: string[];
  userSigned: boolean;
}

/**
 * Interface for the petition signature request body
 */
interface PetitionSignatureRequest {
  accountId: Address;
  message: string;
  signature: string;
  daoId: DaoIdEnum;
  timestamp: string;
}

/**
 * Fetches petition signatures for a specific DAO and user
 * @param daoId - The ID of the DAO to fetch signatures for
 * @param userAddress - The address of the user to check signature status
 * @returns Promise<PetitionResponse> - The petition data with signatures
 */
const fetchPetitionSignatures = async (
  daoId: DaoIdEnum,
  userAddress: Address,
): Promise<PetitionResponse> => {
  const response = await fetch(
    `${PETITION_ENDPOINT}/petition/${daoId}?userAddress=${userAddress}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch petition data: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Submits a new petition signature
 * @param daoId - The ID of the DAO to submit the signature for
 * @param signature - The signature to submit
 * @param userAddress - The address of the user submitting the signature
 * @returns Promise<PetitionResponse> - The updated petition data
 */
const submitPetitionSignature = async (
  daoId: DaoIdEnum,
  signature: Hex,
  userAddress: Address,
): Promise<PetitionResponse> => {
  const requestBody: PetitionSignatureRequest = {
    accountId: userAddress,
    message: "I support Arbitrum fully integrated into the Anticapture",
    signature,
    daoId,
    timestamp: String(new Date().getTime()),
  };

  const response = await fetch(`${PETITION_ENDPOINT}/petition`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to submit petition signature: ${response.statusText}`,
    );
  }
  return response.json();
};

/**
 * Hook for fetching petition signatures
 * @param daoId - The ID of the DAO to fetch signatures for
 * @param userAddress - The address of the user to check signature status
 * @returns PetitionResponse data and loading/error states
 */
export const usePetitionSignatures = (
  daoId: DaoIdEnum,
  userAddress: Address | undefined,
) => {
  const { data, error, isLoading, mutate } = useSWR<PetitionResponse>(
    daoId && userAddress ? `petition/${daoId}/${userAddress}` : null,
    () => {
      if (!userAddress) {
        throw new Error("User address is required to fetch petition data");
      }
      return fetchPetitionSignatures(daoId, userAddress);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    data: data || null,
    loading: isLoading,
    error: error || null,
    refetch: () => mutate(),
  };
};

/**
 * Hook for submitting petition signatures
 * @param daoId - The ID of the DAO to submit the signature for
 * @param userAddress - The address of the user submitting the signature
 * @returns Function to submit signature and loading/error states
 */
export const useSubmitPetition = (
  daoId: DaoIdEnum,
  userAddress: Address | undefined,
) => {
  const submit = async (signature: Address) => {
    if (!userAddress) {
      throw new Error("User address is required to submit signature");
    }

    try {
      return await submitPetitionSignature(daoId, signature, userAddress);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to submit signature: ${error.message}`);
      }
      throw new Error("Failed to submit signature: Unknown error");
    }
  };

  return submit;
};
