/* eslint-disable prettier/prettier */
import dotenv from "dotenv";
import { ENSGovernorAbi, ENSTokenAbi } from "./src/ens/abi";
import { UNITokenAbi } from "./src/uni/abi";
import { COMPTokenAbi } from "./src/comp/abi";
import { Address, zeroAddress } from "viem";
import { SHUTokenAbi } from "./src/shu/abi";
dotenv.config();

export type PonderContracts = {
  [contractName: string]: {
    abi: readonly any[];
    network: string;
    address: Address;
    startBlock: number;
  };
};

export const config = {
  production: {
    networks: {
      name: "mainnet",
      chainId: 1,
      rpcUrls: [`http://127.0.0.1:8545`],
    },
    contracts: {
      ENSToken: {
        abi: ENSTokenAbi,
        network: "mainnet",
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        startBlock: 9380410,
      },
      ENSGovernor: {
        abi: ENSGovernorAbi,
        network: "mainnet",
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        startBlock: 13533772,
      },
      UNIToken: {
        abi: UNITokenAbi,
        network: "mainnet",
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        startBlock: 10861674,
      },
      COMPToken: {
        abi: COMPTokenAbi,
        network: "mainnet",
        address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
        startBlock: 9601359,
      },
      SHUToken: {
        abi: SHUTokenAbi,
        address: "0xe485e2f1bab389c08721b291f6b59780fec83fd7",
        startBlock: 19021394,
        network: "mainnet",
      },
    } as PonderContracts,
  },
  staging: {
    networks: {
      name: "mainnet",
      chainId: 1,
      rpcUrls: [`http://127.0.0.1:8545`],
    },
    contracts: {
      ENSToken: {
        abi: ENSTokenAbi,
        network: "mainnet",
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        startBlock: 9380410,
      },
      ENSGovernor: {
        abi: ENSGovernorAbi,
        network: "mainnet",
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        startBlock: 13533772,
      },
      UNIToken: {
        abi: UNITokenAbi,
        network: "mainnet",
        address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        startBlock: 10861674,
      },
      COMPToken: {
        abi: COMPTokenAbi,
        network: "mainnet",
        address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
        startBlock: 9601359,
      },
      SHUToken: {
        abi: SHUTokenAbi,
        address: "0xe485e2f1bab389c08721b291f6b59780fec83fd7",
        startBlock: 19021394,
        network: "mainnet",
      },
    } as PonderContracts,
  },
  test: {
    networks: {
      name: "anvil",
      chainId: 31337,
      disableCache: true,
      rpcUrls: [process.env.PONDER_TEST_RPC_URL_1],
    },
    contracts: {
      ENSToken: {
        abi: ENSTokenAbi,
        network: "anvil",
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        startBlock: 0,
      },
      ENSGovernor: {
        abi: ENSGovernorAbi,
        network: "anvil",
        address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        startBlock: 0,
      },
      UNIToken: {
        abi: UNITokenAbi,
        network: "anvil",
        address: zeroAddress,
        startBlock: 0,
      },
      COMPToken: {
        abi: COMPTokenAbi,
        network: "anvil",
        address: zeroAddress,
        startBlock: 0,
      },
      SHUToken: {
        abi: SHUTokenAbi,
        address: zeroAddress,
        startBlock: 0,
        network: "anvil",
      },
    } as PonderContracts,
  },
};
