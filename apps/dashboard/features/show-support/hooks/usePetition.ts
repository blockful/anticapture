"use client"

import { Address, createPublicClient, custom, Hex, http, parseAbi } from "viem";
import { Web3Provider } from "@ethersproject/providers";
import snapshot from "@snapshot-labs/snapshot.js";
import useSWR from "swr";
import { multicall } from "viem/actions";

import { DaoIdEnum } from "@/shared/types/daos";
import daoConfig from "@/shared/dao-config";
import { getChain } from "@/shared/utils/chain";
import { walletClient } from "@/shared/services/wallet/wallet";

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
) => {

  const { data: signatures, error, isLoading } = useSWR<PetitionResponse>(
    "https://hub.snapshot.org/graphql",
    () => fetchPetitionSignatures()
  )
  const snapshotClient = new snapshot.Client712("https://hub.snapshot.org");
  const config = daoConfig[daoId];

  const client = createPublicClient({
    chain: getChain(config.daoOverview.chainId),
    transport: custom(window.ethereum)
  });
  /**
 * Fetches petition signatures for a specific DAO and user
 * @returns Promise<PetitionResponse> - The petition data with signatures
 */
  const fetchPetitionSignatures = async (userAddress?: Address): Promise<PetitionResponse> => {
    const response = await fetch("https://hub.snapshot.org/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      contracts:
        signers.map((signer: Address) => ({
          abi: parseAbi(['function getVotes(address account) view returns (uint256)']),
          address: tokenAddress,
          functionName: "getVotes",
          args: [signer]
        }))
    })

    const totalSignaturesPower = votePowers.reduce((acc, curr) => acc + Number(curr.result), 0).toString();

    return {
      signers,
      totalSignatures: signers.length,
      totalSignaturesPower,
      userSigned: signers.includes(userAddress)
    };
  };

  /**
   * Submits a new petition signature through the snapshot API
   */
  const submitSignature = async (userAddress: Address) => {
    const { snapshotProposal: proposal, snapshotSpace: space } = config.showSupport || {};
    if (!proposal || !space) {
      throw new Error("Proposal ID not found");
    }

    try {
      const web3 = new Web3Provider(walletClient.transport);
      debugger

      await snapshotClient.vote(web3, userAddress, {
        proposal,
        type: "single-choice",
        choice: "For",
        space,
        app: "Anticapture",
        from: userAddress
      });

    } catch (error) {
      console.error(error);
      debugger
    }
  };

  return {
    signatures,
    error,
    isLoading,
    submitSignature
  }
};
