/* eslint-disable prettier/prettier */
import dotenv from "dotenv";
import { ENSGovernorAbi, ENSTokenAbi } from "./src/indexer/ens/abi";
import { UNIGovernorAbi, UNITokenAbi } from "./src/indexer/uni/abi";
import { Address, webSocket, zeroAddress } from "viem";
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
  network: NetworkEnum;
  address: Address;
  startBlock: number;
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
        chainId: 1,
        transport: webSocket(process.env.PONDER_RPC_URL_ETH_1 as string),
        maxRequestsPerSecond:
          process.env.STATUS !== "production" &&
          process.env.STATUS !== "staging"
            ? 10000
            : 1000,
      },
      [NetworkEnum.ARBITRUM]: {
        chainId: 42161,
        transport: webSocket(process.env.PONDER_RPC_URL_ARB_1 as string),
        maxRequestsPerSecond:
          process.env.STATUS !== "production" &&
          process.env.STATUS !== "staging"
            ? 10000
            : 1000,
      },
    },
    contracts: {
      ENSToken: {
        abi: contractAbis.ENSToken,
        network: NetworkEnum.MAINNET,
        address: CONTRACT_ADDRESSES[NetworkEnum.MAINNET][DaoIdEnum.ENS].token,
        startBlock: 9380410,
      } as PonderContract<"ENSToken">,
      ENSGovernor: {
        abi: contractAbis.ENSGovernor,
        network: NetworkEnum.MAINNET,
        address:
          CONTRACT_ADDRESSES[NetworkEnum.MAINNET][DaoIdEnum.ENS].governor,
        startBlock: 13533772,
      } as PonderContract<"ENSGovernor">,
      UNIToken: {
        abi: contractAbis.UNIToken,
        network: NetworkEnum.MAINNET,
        address: CONTRACT_ADDRESSES[NetworkEnum.MAINNET][DaoIdEnum.UNI].token,
        startBlock: 10861674,
      } as PonderContract<"UNIToken">,
      UNIGovernor: {
        abi: contractAbis.UNIGovernor,
        network: NetworkEnum.MAINNET,
        address:
          CONTRACT_ADDRESSES[NetworkEnum.MAINNET][DaoIdEnum.UNI].governor,
        startBlock: 13059157,
      } as PonderContract<"UNIGovernor">,
      ARBToken: {
        abi: contractAbis.ARBToken,
        network: NetworkEnum.ARBITRUM,
        address: CONTRACT_ADDRESSES[NetworkEnum.ARBITRUM][DaoIdEnum.ARB].token,
        startBlock: 0,
      } as PonderContract<"ARBToken">,
    },
  },
  staging: {
    networks: {
      [NetworkEnum.MAINNET]: {
        chainId: 1,
        transport: webSocket(process.env.PONDER_RPC_URL_ETH_1 as string),
        maxRequestsPerSecond:
          process.env.STATUS !== "production" &&
          process.env.STATUS !== "staging"
            ? 10000
            : 1000,
      },
      [NetworkEnum.ARBITRUM]: {
        chainId: 42161,
        transport: webSocket(process.env.PONDER_RPC_URL_ARB_1 as string),
        maxRequestsPerSecond:
          process.env.STATUS !== "production" &&
          process.env.STATUS !== "staging"
            ? 10000
            : 1000,
      },
    },
    contracts: {
      ENSToken: {
        abi: contractAbis.ENSToken,
        network: NetworkEnum.MAINNET,
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        startBlock: 9380410,
      } as PonderContract<"ENSToken">,
      ENSGovernor: {
        abi: contractAbis.ENSGovernor,
        network: NetworkEnum.MAINNET,
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        startBlock: 13533772,
      } as PonderContract<"ENSGovernor">,
      UNIToken: {
        abi: contractAbis.UNIToken,
        network: NetworkEnum.MAINNET,
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        startBlock: 10861674,
      } as PonderContract<"UNIToken">,
      UNIGovernor: {
        abi: contractAbis.UNIGovernor,
        network: NetworkEnum.MAINNET,
        address: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
        startBlock: 13059157,
      } as PonderContract<"UNIGovernor">,
      ARBToken: {
        abi: contractAbis.ARBToken,
        network: NetworkEnum.ARBITRUM,
        address: CONTRACT_ADDRESSES[NetworkEnum.ARBITRUM][DaoIdEnum.ARB].token,
        startBlock: 0,
      } as PonderContract<"ARBToken">,
    },
  },
  test: {
    networks: {
      [NetworkEnum.ANVIL]: {
        chainId: 31337,
        disableCache: true,
        transport: webSocket(process.env.PONDER_TEST_RPC_URL_1 as string),
        maxRequestsPerSecond:
          process.env.STATUS !== "production" &&
          process.env.STATUS !== "staging"
            ? 10000
            : 1000,
      },
    },
    contracts: {
      ENSToken: {
        abi: contractAbis.ENSToken,
        network: NetworkEnum.ANVIL,
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        startBlock: 0,
      } as PonderContract<"ENSToken">,
      ENSGovernor: {
        abi: contractAbis.ENSGovernor,
        network: NetworkEnum.ANVIL,
        address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        startBlock: 0,
      } as PonderContract<"ENSGovernor">,
      UNIToken: {
        abi: contractAbis.UNIToken,
        network: NetworkEnum.ANVIL,
        address: zeroAddress,
        startBlock: 0,
      } as PonderContract<"UNIToken">,
      UNIGovernor: {
        abi: contractAbis.UNIGovernor,
        network: NetworkEnum.ANVIL,
        address: zeroAddress,
        startBlock: 0,
      } as PonderContract<"UNIGovernor">,
      ARBToken: {
        abi: contractAbis.ARBToken,
        network: NetworkEnum.ANVIL,
        address: zeroAddress,
        startBlock: 0,
      } as PonderContract<"ARBToken">,
    },
  },
} as const;
