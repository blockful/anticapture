/* eslint-disable prettier/prettier */
import dotenv from "dotenv";
import { ENSGovernorAbi, ENSTokenAbi } from "./src/modules/ens/abi";
import { UNIGovernorAbi, UNITokenAbi } from "./src/modules/uni/abi";
import { COMPTokenAbi } from "./src/modules/comp/abi";
import { Abi, Address, zeroAddress } from "viem";
import { SHUTokenAbi } from "./src/modules/shu/abi";
import { anvil, mainnet } from "viem/chains";
dotenv.config();

export type PonderContract<AbiType> = {
  abi: AbiType;
  network: "mainnet" | "anvil";
  address: Address;
  startBlock: number;
};

export type ViemConfig = {
  url: string;
  chain: typeof mainnet | typeof anvil;
};

export const config = {
  viem: {
    production: {
      url: process.env.PONDER_RPC_URL_1,
      chain: mainnet,
    } as ViemConfig,
    staging: {
      url: process.env.PONDER_RPC_URL_1,
      chain: mainnet,
    } as ViemConfig,
    test: {
      url: process.env.PONDER_TEST_RPC_URL_1,
      chain: anvil,
    } as ViemConfig,
  },
  ponder: {
    production: {
      networks: {
        name: "mainnet",
        chainId: 1,
        rpcUrls: [process.env.PONDER_RPC_URL_1, process.env.PONDER_RPC_URL_2],
      },
      contracts: {
        // ENSToken: {
        //   abi: ENSTokenAbi,
        //   network: "mainnet",
        //   address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        //   startBlock: 9380410,
        // } as PonderContract<typeof ENSTokenAbi>,
        // ENSGovernor: {
        //   abi: ENSGovernorAbi as typeof ENSGovernorAbi,
        //   network: "mainnet",
        //   address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        //   startBlock: 13533772,
        // } as PonderContract<typeof ENSGovernorAbi>,
        UNIToken: {
          abi: UNITokenAbi as typeof UNITokenAbi,
          network: "mainnet",
          address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          startBlock: 10861674,
        } as PonderContract<typeof UNITokenAbi>,
        UNIGovernor: {
          abi: UNIGovernorAbi,
          network: "mainnet",
          address: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
          startBlock: 13059157,
        } as PonderContract<typeof UNIGovernorAbi>,
        // COMPToken: {
        //   abi: COMPTokenAbi as typeof COMPTokenAbi,
        //   network: "mainnet",
        //   address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
        //   startBlock: 9601359,
        // } as PonderContract<typeof COMPTokenAbi>,
        // SHUToken: {
        //   abi: SHUTokenAbi,
        //   address: "0xe485e2f1bab389c08721b291f6b59780fec83fd7",
        //   startBlock: 19021394,
        //   network: "mainnet",
        // } as PonderContract<typeof SHUTokenAbi>,
      },
    },
    staging: {
      networks: {
        name: "mainnet",
        chainId: 1,
        rpcUrls: [process.env.PONDER_RPC_URL_1],
      },
      contracts: {
        // ENSToken: {
        //   abi: ENSTokenAbi,
        //   network: "mainnet",
        //   address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        //   startBlock: 9380410,
        // } as PonderContract<typeof ENSTokenAbi>,
        // ENSGovernor: {
        //   abi: ENSGovernorAbi,
        //   network: "mainnet",
        //   address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        //   startBlock: 13533772,
        // } as PonderContract<typeof ENSGovernorAbi>,
        UNIToken: {
          abi: UNITokenAbi,
          network: "mainnet",
          address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          startBlock: 10861674,
        } as PonderContract<typeof UNITokenAbi>,
        UNIGovernor: {
          abi: UNIGovernorAbi,
          network: "mainnet",
          address: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
          startBlock: 13059157,
        } as PonderContract<typeof UNIGovernorAbi>,
        // COMPToken: {
        //   abi: COMPTokenAbi,
        //   network: "mainnet",
        //   address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
        //   startBlock: 9601359,
        // } as PonderContract<typeof COMPTokenAbi>,
        // SHUToken: {
        //   abi: SHUTokenAbi,
        //   address: "0xe485e2f1bab389c08721b291f6b59780fec83fd7",
        //   startBlock: 19021394,
        //   network: "mainnet",
        // } as PonderContract<typeof SHUTokenAbi>,
      },
    },
    test: {
      networks: {
        name: "anvil",
        chainId: 31337,
        disableCache: true,
        rpcUrls: [process.env.PONDER_TEST_RPC_URL_1],
      },
      contracts: {
        // ENSToken: {
        //   abi: ENSTokenAbi,
        //   network: "anvil",
        //   address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        //   startBlock: 0,
        // } as PonderContract<typeof ENSTokenAbi>,
        // ENSGovernor: {
        //   abi: ENSGovernorAbi,
        //   network: "anvil",
        //   address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        //   startBlock: 0,
        // } as PonderContract<typeof ENSGovernorAbi>,
        UNIToken: {
          abi: UNITokenAbi,
          network: "anvil",
          address: zeroAddress,
          startBlock: 0,
        } as PonderContract<typeof UNITokenAbi>,
        UNIGovernor: {
          abi: UNIGovernorAbi,
          network: "anvil",
          address: zeroAddress,
          startBlock: 0,
        } as PonderContract<typeof UNIGovernorAbi>,
        // COMPToken: {
        //   abi: COMPTokenAbi,
        //   network: "anvil",
        //   address: zeroAddress,
        //   startBlock: 0,
        // } as PonderContract<typeof COMPTokenAbi>,
        // SHUToken: {
        //   abi: SHUTokenAbi,
        //   address: zeroAddress,
        //   startBlock: 0,
        //   network: "anvil",
        // } as PonderContract<typeof SHUTokenAbi>,
      },
    },
  },
};
