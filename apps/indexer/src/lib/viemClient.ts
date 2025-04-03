import {
  Address,
  Abi,
  createPublicClient,
  getContract,
  http,
  webSocket,
} from "viem";
import { config } from "@/../config";
import { UNIGovernorAbi, UNITokenAbi } from "@/indexer/uni/abi";
import dotenv from "dotenv";
import { anvil, arbitrum, mainnet } from "viem/chains";
import { ENSGovernorAbi, ENSTokenAbi } from "@/indexer/ens/abi";
import { DaoIdEnum, NetworkEnum } from "./enums";
import { GovernorAbiType, TokenAbiType } from "@/indexer/types";
import { ARBTokenAbi } from "@/indexer/arb/abi/ARBTokenAbi";
dotenv.config();

const ponderConfig =
  config[process.env.STATUS as "production" | "staging" | "test"];

type TokenDaoConfig = {
  tokenAbi: TokenAbiType;
  tokenAddress: Address;
};

type GovernorDaoConfig = {
  governorAbi: GovernorAbiType;
  governorAddress: Address;
};

type DaoConfigs = {
  [key in Exclude<DaoIdEnum, DaoIdEnum.ARB>]: TokenDaoConfig &
    GovernorDaoConfig;
} & {
  [DaoIdEnum.ARB]: TokenDaoConfig;
};

type DaoConfigsByNetwork = {
  [key in NetworkEnum]: Partial<DaoConfigs>;
};

const viemClient = () => {
  const clients = {
    [NetworkEnum.MAINNET]: createPublicClient({
      chain: mainnet,
      transport: webSocket(process.env.PONDER_RPC_URL_ETH_1),
    }),
    [NetworkEnum.ARBITRUM]: createPublicClient({
      chain: arbitrum,
      transport: webSocket(process.env.PONDER_RPC_URL_ARB_1),
    }),
    [NetworkEnum.ANVIL]: createPublicClient({
      chain: anvil,
      transport: webSocket(process.env.PONDER_RPC_URL_ANVIL_1),
    }),
  };

  const daoConfigParams: DaoConfigsByNetwork = {
    [NetworkEnum.MAINNET]: {
      [DaoIdEnum.UNI]: {
        tokenAbi: UNITokenAbi,
        tokenAddress: ponderConfig.contracts.UNIToken?.address as Address,
        governorAbi: UNIGovernorAbi,
        governorAddress: ponderConfig.contracts.UNIGovernor?.address as Address,
      },
      [DaoIdEnum.ENS]: {
        tokenAbi: ENSTokenAbi,
        tokenAddress: ponderConfig.contracts.ENSToken?.address as Address,
        governorAbi: ENSGovernorAbi,
        governorAddress: ponderConfig.contracts.ENSGovernor?.address as Address,
      },
    },
    [NetworkEnum.ARBITRUM]: {
      [DaoIdEnum.ARB]: {
        tokenAbi: ARBTokenAbi,
        tokenAddress: ponderConfig.contracts.ARBToken?.address as Address,
      },
    },
    [NetworkEnum.ANVIL]: {},
  };

  const getDecimals = async (daoId: DaoIdEnum, network: NetworkEnum) => {
    const tokenContract = getContract({
      client: clients[network],
      abi: daoConfigParams[network][daoId]?.tokenAbi as TokenAbiType,
      address: daoConfigParams[network][daoId]?.tokenAddress as Address,
    });
    return await tokenContract.read.decimals();
  };

  const getQuorum = async (
    daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>,
    network: NetworkEnum
  ) => {
    const governorContract = getContract({
      client: clients[network],
      abi: daoConfigParams[network][daoId]?.governorAbi as GovernorAbiType,
      address: daoConfigParams[network][daoId]?.governorAddress as Address,
    });
    switch (daoId) {
      case DaoIdEnum.UNI:
        return await governorContract.read.quorumVotes();
      case DaoIdEnum.ENS:
        const blockNumber = await clients[network].getBlockNumber();
        return await governorContract.read.quorum([blockNumber - 10n]);
    }
  };

  const getProposalThreshold = async (
    daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>,
    network: NetworkEnum
  ) => {
    const governorContract = getContract({
      client: clients[network],
      abi: daoConfigParams[network][daoId]?.governorAbi as GovernorAbiType,
      address: daoConfigParams[network][daoId]?.governorAddress as Address,
    });
    return await governorContract.read.proposalThreshold();
  };

  const getVotingDelay = async (
    daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>,
    network: NetworkEnum
  ) => {
    const governorContract = getContract({
      client: clients[network],
      abi: daoConfigParams[network][daoId]?.governorAbi as GovernorAbiType,
      address: daoConfigParams[network][daoId]?.governorAddress as Address,
    });
    return await governorContract.read.votingDelay();
  };

  const getVotingPeriod = async (
    daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>,
    network: NetworkEnum
  ) => {
    const governorContract = getContract({
      client: clients[network],
      abi: daoConfigParams[network][daoId]?.governorAbi as GovernorAbiType,
      address: daoConfigParams[network][daoId]?.governorAddress as Address,
    });
    return await governorContract.read.votingPeriod();
  };

  const getTimelockDelay = async (
    daoId: Exclude<DaoIdEnum, DaoIdEnum.ARB>,
    network: NetworkEnum
  ): Promise<bigint> => {
    const governorContract = getContract({
      client: clients[network],
      abi: daoConfigParams[network][daoId]?.governorAbi as GovernorAbiType,
      address: daoConfigParams[network][daoId]?.governorAddress as Address,
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
      client: clients[network],
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
