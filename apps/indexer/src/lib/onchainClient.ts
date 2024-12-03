import dotenv from "dotenv";
import { Context } from "@/generated";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
dotenv.config();

const onchainClient = (context: Context) => {
  const daoConfigParams = {
    UNI: {
      tokenAbi: context.contracts.UNIToken.abi,
      tokenAddress: context.contracts.UNIToken.address,
      governorAbi: context.contracts.UNIGovernor.abi,
      governorAddress: context.contracts.UNIGovernor.address,
    },
  };

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.PONDER_RPC_URL_1),
  });


  const getTotalSupply = async (daoId: "UNI" = "UNI") => {
    const blockNumber = await publicClient.getBlockNumber();
    console.log(blockNumber);
    return await context.client.readContract({
      abi: daoConfigParams[daoId].tokenAbi,
      address: daoConfigParams[daoId].tokenAddress,
      functionName: "totalSupply",
      blockNumber,
    });
  };

  const getDecimals = async (daoId: "UNI" = "UNI") => {
    const blockNumber = await publicClient.getBlockNumber();
    return await context.client.readContract({
      abi: daoConfigParams[daoId].tokenAbi,
      address: daoConfigParams[daoId].tokenAddress,
      functionName: "decimals",
      blockNumber,
    });
  };

  const getQuorum = async (daoId: "UNI" = "UNI") => {
    const blockNumber = await publicClient.getBlockNumber();
    return await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "quorumVotes",
      blockNumber,
    });
  };

  const getProposalThreshold = async (daoId: "UNI" = "UNI") => {
    const blockNumber = await publicClient.getBlockNumber();
    return await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "proposalThreshold",
      blockNumber,
    });
  };

  const getVotingDelay = async (daoId: "UNI" = "UNI") => {
    const blockNumber = await publicClient.getBlockNumber();
    return await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "votingDelay",
      blockNumber,
    });
  };

  const getVotingPeriod = async (daoId: "UNI" = "UNI") => {
    const blockNumber = await publicClient.getBlockNumber();
    console.log(blockNumber);
    const votingPeriod = await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "votingPeriod",
      blockNumber,
    });
    return votingPeriod;
  };

  const getTimelockDelay = async (daoId: "UNI" = "UNI") => {
    const blockNumber = await publicClient.getBlockNumber();
    const timelockAddress = await context.client.readContract({
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
      functionName: "timelock",
      blockNumber,
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
      blockNumber,
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
