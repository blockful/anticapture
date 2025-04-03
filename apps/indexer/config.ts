/* eslint-disable prettier/prettier */
import dotenv from "dotenv";
import { ENSGovernorAbi, ENSTokenAbi } from "./src/indexer/ens/abi";
import { UNIGovernorAbi, UNITokenAbi } from "./src/indexer/uni/abi";
import { Address, zeroAddress } from "viem";
import { anvil, arbitrum, mainnet } from "viem/chains";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum, NetworkEnum } from "@/lib/enums";
import { ARBTokenAbi } from "./src/indexer/arb/abi/ARBTokenAbi";

dotenv.config();

// Contract ABI type mapping
export type ContractAbis = {
  ENSToken: typeof ENSTokenAbi;
  ENSGovernor: typeof ENSGovernorAbi;
  UNIToken: typeof UNITokenAbi;
  UNIGovernor: typeof UNIGovernorAbi;
  ARBToken: typeof ARBTokenAbi;
};

export type ContractName = keyof ContractAbis;

export type PonderContract<T extends ContractName> = {
  abi: ContractAbis[T];
  network: "mainnet" | "anvil" | "arbitrum";
  address: Address;
  startBlock: number;
};

export type Network = {
  name: string;
  chain: typeof mainnet | typeof anvil | typeof arbitrum;
  chainId: number;
  rpcUrls: string[];
  disableCache?: boolean;
};

type EnvironmentConfig = {
  networks: Partial<Record<NetworkEnum, Network>>;
  contracts: Partial<Record<ContractName, PonderContract<ContractName>>>;
};

type Config = {
  [key in "production" | "staging" | "test"]: EnvironmentConfig;
};

// Contract ABI mapping
export const contractAbis: ContractAbis = {
  ENSToken: ENSTokenAbi,
  ENSGovernor: ENSGovernorAbi,
  UNIToken: UNITokenAbi,
  UNIGovernor: UNIGovernorAbi,
  ARBToken: ARBTokenAbi,
};

export const config = {
  production: {
    networks: {
      [NetworkEnum.MAINNET]: {
        name: "mainnet",
        chain: mainnet,
        chainId: 1,
        rpcUrls: [process.env.PONDER_RPC_URL_ETH_1 as string],
      },
      [NetworkEnum.ARBITRUM]: {
        name: "arbitrum",
        chainId: 42161,
        chain: arbitrum,
        rpcUrls: [process.env.PONDER_RPC_URL_ARB_1 as string],
      },
    },
    contracts: {
      ENSToken: {
        abi: contractAbis.ENSToken,
        network: "mainnet",
        address: CONTRACT_ADDRESSES[NetworkEnum.MAINNET][DaoIdEnum.ENS].token,
        startBlock: 9380410,
      } as PonderContract<"ENSToken">,
      ENSGovernor: {
        abi: contractAbis.ENSGovernor,
        network: "mainnet",
        address: CONTRACT_ADDRESSES[NetworkEnum.MAINNET][DaoIdEnum.ENS].governor,
        startBlock: 13533772,
      } as PonderContract<"ENSGovernor">,
      UNIToken: {
        abi: contractAbis.UNIToken,
        network: "mainnet",
        address: CONTRACT_ADDRESSES[NetworkEnum.MAINNET][DaoIdEnum.UNI].token,
        startBlock: 10861674,
      } as PonderContract<"UNIToken">,
      UNIGovernor: {
        abi: contractAbis.UNIGovernor,
        network: "mainnet",
        address: CONTRACT_ADDRESSES[NetworkEnum.MAINNET][DaoIdEnum.UNI].governor,
        startBlock: 13059157,
      } as PonderContract<"UNIGovernor">,
      ARBToken: {
        abi: contractAbis.ARBToken,
        network: "arbitrum",
        address: CONTRACT_ADDRESSES[NetworkEnum.ARBITRUM][DaoIdEnum.ARB].token,
        startBlock: 0,
      } as PonderContract<"ARBToken">,
    },
  },
  staging: {
    networks: {
      [NetworkEnum.MAINNET]: {
        name: "mainnet",
        chainId: 1,
        chain: mainnet,
        rpcUrls: [process.env.PONDER_RPC_URL_ETH_1 as string],
      },
      [NetworkEnum.ARBITRUM]: {
        name: "arbitrum",
        chainId: 42161,
        chain: arbitrum,
        rpcUrls: [process.env.PONDER_RPC_URL_ARB_1 as string],
      },
    },
    contracts: {
      ENSToken: {
        abi: contractAbis.ENSToken,
        network: "mainnet",
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        startBlock: 9380410,
      } as PonderContract<"ENSToken">,
      ENSGovernor: {
        abi: contractAbis.ENSGovernor,
        network: "mainnet",
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        startBlock: 13533772,
      } as PonderContract<"ENSGovernor">,
      UNIToken: {
        abi: contractAbis.UNIToken,
        network: "mainnet",
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        startBlock: 10861674,
      } as PonderContract<"UNIToken">,
      UNIGovernor: {
        abi: contractAbis.UNIGovernor,
        network: "mainnet",
        address: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
        startBlock: 13059157,
      } as PonderContract<"UNIGovernor">,
      ARBToken: {
        abi: contractAbis.ARBToken,
        network: "arbitrum",
        address: CONTRACT_ADDRESSES[NetworkEnum.ARBITRUM][DaoIdEnum.ARB].token,
        startBlock: 0,
      } as PonderContract<"ARBToken">,
    },
  },
  test: {
    networks: {
      [NetworkEnum.ANVIL]: {
        name: "anvil",
        chainId: 31337,
        chain: anvil,
        disableCache: true,
        rpcUrls: [process.env.PONDER_TEST_RPC_URL_1 as string],
      },
    },
    contracts: {
      ENSToken: {
        abi: contractAbis.ENSToken,
        network: "anvil",
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        startBlock: 0,
      } as PonderContract<"ENSToken">,
      ENSGovernor: {
        abi: contractAbis.ENSGovernor,
        network: "anvil",
        address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        startBlock: 0,
      } as PonderContract<"ENSGovernor">,
      UNIToken: {
        abi: contractAbis.UNIToken,
        network: "anvil",
        address: zeroAddress,
        startBlock: 0,
      } as PonderContract<"UNIToken">,
      UNIGovernor: {
        abi: contractAbis.UNIGovernor,
        network: "anvil",
        address: zeroAddress,
        startBlock: 0,
      } as PonderContract<"UNIGovernor">,
      ARBToken: {
        abi: contractAbis.ARBToken,
        network: "anvil",
        address: zeroAddress,
        startBlock: 0,
      } as PonderContract<"ARBToken">,
    },
  },
} as const;
