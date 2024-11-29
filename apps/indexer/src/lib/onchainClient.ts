import { UNIGovernorAbi, UNITokenAbi } from "@/uni/abi";
import dotenv from "dotenv";
import { Context } from "@/generated";
import ponderConfig from "../../ponder.config";
dotenv.config();

const onchainClient = (context: Context) => {
  const daoConfigParams = {
    UNI: {
      tokenAbi: UNITokenAbi,
      tokenAddress: ponderConfig.contracts.UNIToken.address,
      governorAbi: UNIGovernorAbi,
      governorAddress: ponderConfig.contracts.UNIGovernor.address,
    },
  };
  const getTotalSupply = async (daoId: "UNI" = "UNI") => {
    return await context.client.readContract({
      abi: daoConfigParams[daoId].tokenAbi,
      address: daoConfigParams[daoId].tokenAddress,
      functionName: "totalSupply",
    });
  };

  const getDecimals = async (daoId: "UNI" = "UNI") => {
    return await context.client.readContract({
      abi: daoConfigParams[daoId].tokenAbi,
      address: daoConfigParams[daoId].tokenAddress,
      functionName: "decimals",
    });
  };

  const getQuorum = async (daoId: "UNI" = "UNI") => {
    return await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "quorumVotes",
    });
  };

  const getProposalThreshold = async (daoId: "UNI" = "UNI") => {
    return await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "proposalThreshold",
    });
  };

  const getVotingDelay = async (daoId: "UNI" = "UNI") => {
    return await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "votingDelay",
    });
  };

  const getVotingPeriod = async (daoId: "UNI" = "UNI") => {
    return await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "votingPeriod",
    });
  };

  const getTimelockDelay = async (daoId: "UNI" = "UNI") => {
    const timelockAddress = await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "timelock",
    });
    const timelockAbi = [
      {
        constant: true,
        inputs: [],
        name: "delay",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ] as const;
    return await context.client.readContract({
      abi: timelockAbi,
      address: timelockAddress,
      functionName: "delay",
    });
  };

  return {
    getVotingDelay,
    getVotingPeriod,
    getTimelockDelay,
    getTotalSupply,
    getDecimals,
    getQuorum,
    getProposalThreshold,
    daoConfigParams,
  };
};

export default onchainClient;
