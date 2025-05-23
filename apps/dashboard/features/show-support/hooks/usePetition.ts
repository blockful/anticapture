"use client"

import { useState } from "react";
import { Address, createPublicClient, Hex, http, parseAbi } from "viem";
import { Web3Provider } from "@ethersproject/providers";
import snapshot from "@snapshot-labs/snapshot.js";
import useSWR, { mutate } from "swr";
import { multicall } from "viem/actions";
import { useWalletClient } from "wagmi";

import { DaoIdEnum } from "@/shared/types/daos";
import daoConfig from "@/shared/dao-config";
import { getChain } from "@/shared/utils/chain";

/**
 * 
 * Interface for the petition API response
 */
export interface PetitionResponse {
  signers: Hex[];
  totalSignatures: number;
  totalSignaturesPower: string;
  userSigned: boolean;
}


const GET_SIGNERS_QUERY = /* GraphQL */ `
  query Votes($proposal: String!) {
    votes(where: { proposal: $proposal }) {
      voter
    }
  }
`;


/**
 * Hook for fetching petition signatures
 * @param daoId - The ID of the DAO to fetch signatures for
 * @param userAddress - The address of the user to check signature status
 * @returns PetitionResponse data and loading/error states
 */
export const usePetitionSignatures = (
  daoId: DaoIdEnum,
  userAddress?: Address
) => {
  const { data: walletClient } = useWalletClient();
  const [writeError, setWriteError] = useState<string | null>(null);

  const snapshotClient = new snapshot.Client712("https://hub.snapshot.org");
  const config = daoConfig[daoId];

  const client = createPublicClient({
    chain: getChain(config.daoOverview.chainId),
    transport: http()
  });

  const fetchPetitionSignatures = async (
    [_key, userAddress]: [string, Address | undefined]
  ): Promise<PetitionResponse> => {
    const response = await fetch("https://hub.snapshot.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GET_SIGNERS_QUERY,
        variables: {
          proposal: config.showSupport?.snapshotProposal,
        },
      }),
    });

    const { data } = await response.json();
    const signers = data.votes.map(({ voter }: any) => voter);
    const tokenAddress = config.daoOverview.contracts.token;

    const votePowers = await multicall(client, {
      contracts: signers.map((signer: Address) => ({
        abi: parseAbi([
          "function getVotes(address account) view returns (uint256)",
        ]),
        address: tokenAddress,
        functionName: "getVotes",
        args: [signer],
      })),
    });

    const totalSignaturesPower = votePowers
      .reduce((acc, curr) => acc + Number(curr.result), 0)
      .toString();

    return {
      signers,
      totalSignatures: signers.length,
      totalSignaturesPower,
      userSigned: signers.includes(userAddress),
    };
  };

  const swrKey = userAddress ? ["petitionSignatures", userAddress] : null;

  const { data: signatures, error, isLoading } = useSWR<PetitionResponse>(
    swrKey,
    fetchPetitionSignatures
  );

  const submitSignature = async (userAddress: Address) => {
    const { snapshotProposal: proposal, snapshotSpace: space } =
      config.showSupport || {};
    if (!proposal || !space) return setWriteError("Proposal ID not found");
    if (!walletClient) return setWriteError("Wallet not connected");

    const web3 = new Web3Provider(walletClient.transport);
    try {
      await snapshotClient.vote(web3, userAddress, {
        proposal,
        type: "single-choice",
        choice: 1,
        space,
        app: "Anticapture",
        from: userAddress,
      });

      mutate(swrKey);
    } catch (error) {
      return setWriteError("Failed to submit signature");
    }
  };

  return {
    signatures,
    error: error || writeError,
    isLoading,
    submitSignature,
  };
};