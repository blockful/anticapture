import { Address, createPublicClient, getContract, http } from "viem";
import { config } from "@/../config";
import { UNIGovernorAbi, UNITokenAbi } from "@/indexer/uni/abi";
import dotenv from "dotenv";
import { anvil, mainnet } from "viem/chains";
import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";
import { DaoIdEnum } from "./enums";
import { GovernorAbiType, TokenAbiType } from "@/indexer/types";
import { ARBTokenAbi } from "@/indexer/arb/abi/ARBTokenAbi";
dotenv.config();

const ponderConfig =
  config.ponder[process.env.STATUS as "production" | "staging" | "test"];

type DaoConfigParams = {
  [key in Exclude<DaoIdEnum, DaoIdEnum.ARB>]: {
    tokenAbi: TokenAbiType;
    tokenAddress: Address;
    governorAbi: GovernorAbiType;
    governorAddress: Address;
  };
} & {
  [DaoIdEnum.ARB]: {
    tokenAbi: TokenAbiType;
    tokenAddress: Address;
  };
};

const viemClient = () => {
  const publicClient = createPublicClient({
    chain: process.env.STATUS !== "test" ? mainnet : anvil,
    transport: http(process.env.ALCHEMY_RPC_URL_1),
  });

  const daoConfigParams: DaoConfigParams = {
    [DaoIdEnum.UNI]: {
      tokenAbi: UNITokenAbi,
      tokenAddress: ponderConfig.contracts.UNIToken.address,
      governorAbi: UNIGovernorAbi,
      governorAddress: ponderConfig.contracts.UNIGovernor.address,
    },
    [DaoIdEnum.ENS]: {
      tokenAbi: ENSTokenAbi,
      tokenAddress: ponderConfig.contracts.ENSToken.address,
      governorAbi: ENSGovernorAbi,
      governorAddress: ponderConfig.contracts.ENSGovernor.address,
    },
    [DaoIdEnum.ARB]: {
      tokenAbi: ARBTokenAbi,
      tokenAddress: ponderConfig.contracts.ARBToken.address,
    },
  };

  const getDecimals = async (daoId: DaoIdEnum) => {
    const tokenContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].tokenAbi,
      address: daoConfigParams[daoId].tokenAddress,
    });
    return await tokenContract.read.decimals();
  };

  const getQuorum = async (daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>) => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    switch (daoId) {
      case DaoIdEnum.UNI:
        return await governorContract.read.quorumVotes();
      case DaoIdEnum.ENS:
        const blockNumber = await publicClient.getBlockNumber();
        return await governorContract.read.quorum([blockNumber - 10n]);
    }
  };

  const getProposalThreshold = async (
    daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>,
  ) => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    return await governorContract.read.proposalThreshold();
  };

  const getVotingDelay = async (daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>) => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    return await governorContract.read.votingDelay();
  };

  const getVotingPeriod = async (daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>) => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    return await governorContract.read.votingPeriod();
  };

  const getTimelockDelay = async (
    daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>,
  ): Promise<bigint> => {
    const governorContract = getContract({
      client: publicClient,
      abi: daoConfigParams[daoId].governorAbi,
      address: daoConfigParams[daoId].governorAddress,
    });
    const timelockBaseAbiConfig = {
      constant: true,
      inputs: [],
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    } as const;

    const timelockAbis = {
      [DaoIdEnum.UNI]: [
        {
          ...timelockBaseAbiConfig,
          name: "delay",
        },
      ] as const,
      [DaoIdEnum.ENS]: [
        {
          ...timelockBaseAbiConfig,
          name: "getMinDelay",
        },
      ] as const,
    };

    const timelockAddress = await governorContract.read.timelock();
    const timelockContract = getContract({
      client: publicClient,
      abi: timelockAbis[daoId as Exclude<DaoIdEnum, DaoIdEnum.ARB>],
      address: timelockAddress,
    });
    return await timelockContract.read[
      timelockAbis[daoId as Exclude<DaoIdEnum, DaoIdEnum.ARB>][0].name
    ]();
  };

  return {
    getVotingDelay,
    getVotingPeriod,
    getTimelockDelay,
    getDecimals,
    getQuorum,
    getProposalThreshold,
    daoConfigParams,
  };
};

export default viemClient();
