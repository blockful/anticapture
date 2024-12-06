import { createPublicClient, getContract, http, webSocket } from "viem";
import { config, ViemConfig } from "../../config";
import { UNIGovernorAbi, UNITokenAbi } from "@/uni/abi";
import dotenv from "dotenv";
dotenv.config();

const viemConfig =
  config.viem[process.env.STATUS as "production" | "staging" | "test"];
const ponderConfig =
  config.ponder[process.env.STATUS as "production" | "staging" | "test"];

const viemClient = (viemConfig: ViemConfig) => {
  const publicClient = createPublicClient({
    chain: viemConfig.chain,
    transport: webSocket(viemConfig.url),
  });

  const daoConfigParams = {
    UNI: {
      tokenAbi: UNITokenAbi,
      tokenAddress: ponderConfig.contracts.UNIToken.address,
      governorAbi: UNIGovernorAbi,
      governorAddress: ponderConfig.contracts.UNIGovernor.address,
    },
  };
  const getTotalSupply = async (daoId: "UNI" = "UNI") => {
    const tokenContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].tokenAbi,
      address: daoConfigParams[daoId].tokenAddress,
    });
    return await tokenContract.read.totalSupply();
  };

  const getDecimals = async (daoId: "UNI" = "UNI") => {
    const tokenContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].tokenAbi,
      address: daoConfigParams[daoId].tokenAddress,
    });
    return await tokenContract.read.decimals();
  };

  const getQuorum = async (daoId: "UNI" = "UNI") => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    return await governorContract.read.quorumVotes();
  };

  const getProposalThreshold = async (daoId: "UNI" = "UNI") => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    return await governorContract.read.proposalThreshold();
  };

  const getVotingDelay = async (daoId: "UNI" = "UNI") => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    return await governorContract.read.votingDelay();
  };

  const getVotingPeriod = async (daoId: "UNI" = "UNI") => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    return await governorContract.read.votingPeriod();
  };

  const getTimelockDelay = async (daoId: "UNI" = "UNI") => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
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
    const timelockAddress = await governorContract.read.timelock();
    const timelockContract = getContract({
      client: publicClient,
      abi: timelockAbi,
      address: timelockAddress,
    });
    return await timelockContract.read.delay();
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

export default viemClient(viemConfig);
