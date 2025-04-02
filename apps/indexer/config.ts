/* eslint-disable prettier/prettier */
import dotenv from "dotenv";
import { ENSGovernorAbi, ENSTokenAbi } from "./src/indexer/ens/abi";
import { UNIGovernorAbi, UNITokenAbi } from "./src/indexer/uni/abi";
import { COMPTokenAbi } from "./src/indexer/comp/abi";
import { Abi, Address, zeroAddress } from "viem";
import { SHUTokenAbi } from "./src/indexer/shu/abi";
import { anvil, arbitrum, mainnet } from "viem/chains";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";
import { ARBTokenAbi } from "./src/indexer/arb/abi/ARBTokenAbi";
dotenv.config();

export type PonderContract<AbiType> = {
  abi: AbiType;
  network: "mainnet" | "anvil" | "arbitrum";
  address: Address;
  startBlock: number;
};

export type ContractName =
  | "ENSToken"
  | "ENSGovernor"
  | "UNIToken"
  | "UNIGovernor"
  | "ARBToken";

export type Network = {
  name: string;
  chain: typeof mainnet | typeof anvil | typeof arbitrum;
  chainId: number;
  rpcUrls: string[];
  contracts: Partial<Record<ContractName, PonderContract<Abi>>>;
  disableCache?: boolean;
};

type Config = {
  ponder: {
    production: {
      networks: Record<string, Network>;
    };
    staging: {
      networks: Record<string, Network>;
    };
    test: {
      networks: Record<string, Network>;
    };
  };
};

export const config: Config = {
  ponder: {
    production: {
      networks: {
        mainnet: {
          name: "mainnet",
          chain: mainnet,
          chainId: 1,
          rpcUrls: [process.env.PONDER_RPC_URL_ETH_1 as string],
          contracts: {
            ENSToken: {
              abi: ENSTokenAbi,
              network: "mainnet",
              address: CONTRACT_ADDRESSES.MAINNET[DaoIdEnum.ENS].token,
              startBlock: 9380410,
            } as PonderContract<typeof ENSTokenAbi>,
            ENSGovernor: {
              abi: ENSGovernorAbi as typeof ENSGovernorAbi,
              network: "mainnet",
              address: CONTRACT_ADDRESSES.MAINNET[DaoIdEnum.ENS].governor,
              startBlock: 13533772,
            } as PonderContract<typeof ENSGovernorAbi>,
            UNIToken: {
              abi: UNITokenAbi as typeof UNITokenAbi,
              network: "mainnet",
              address: CONTRACT_ADDRESSES.MAINNET[DaoIdEnum.UNI].token,
              startBlock: 10861674,
            } as PonderContract<typeof UNITokenAbi>,
            UNIGovernor: {
              abi: UNIGovernorAbi,
              network: "mainnet",
              address: CONTRACT_ADDRESSES.MAINNET[DaoIdEnum.UNI].governor,
              startBlock: 13059157,
            } as PonderContract<typeof UNIGovernorAbi>,
            ARBToken: {
              abi: ARBTokenAbi,
              network: "mainnet",
              address: CONTRACT_ADDRESSES.MAINNET[DaoIdEnum.ARB].token,
              startBlock: 16840305,
            } as PonderContract<typeof ARBTokenAbi>,
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
        arbitrum: {
          name: "arbitrum",
          chainId: 42161,
          chain: arbitrum,
          rpcUrls: [process.env.PONDER_RPC_URL_ARB_1 as string],
          contracts: {
            ARBToken: {
              abi: ARBTokenAbi,
              network: "arbitrum",
              address: CONTRACT_ADDRESSES.ARBITRUM[DaoIdEnum.ARB].token,
              startBlock: 0,
            } as PonderContract<typeof ARBTokenAbi>,
          },
        },
      },
    },
    staging: {
      networks: {
        mainnet: {
          name: "mainnet",
          chainId: 1,
          chain: mainnet,
          rpcUrls: [process.env.PONDER_RPC_URL_1 as string],
          contracts: {
            ENSToken: {
              abi: ENSTokenAbi,
              network: "mainnet",
              address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
              startBlock: 9380410,
            } as PonderContract<typeof ENSTokenAbi>,
            ENSGovernor: {
              abi: ENSGovernorAbi,
              network: "mainnet",
              address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
              startBlock: 13533772,
            } as PonderContract<typeof ENSGovernorAbi>,
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
            ARBToken: {
              abi: ARBTokenAbi,
              network: "mainnet",
              address: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
              startBlock: 16840305,
            } as PonderContract<typeof ARBTokenAbi>,
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
        arbitrum: {
          name: "arbitrum",
          chainId: 42161,
          chain: arbitrum,
          rpcUrls: [process.env.PONDER_RPC_URL_ARB_1 as string],
          contracts: {
            ARBToken: {
              abi: ARBTokenAbi,
              network: "arbitrum",
              address: CONTRACT_ADDRESSES.ARBITRUM[DaoIdEnum.ARB].token,
              startBlock: 0,
            } as PonderContract<typeof ARBTokenAbi>,
          },
        },
      },
    },
    test: {
      networks: {
        anvil: {
          name: "anvil",
          chainId: 31337,
          chain: anvil,
          disableCache: true,
          rpcUrls: [process.env.PONDER_TEST_RPC_URL_1 as string],
          contracts: {
            ENSToken: {
              abi: ENSTokenAbi,
              network: "anvil",
              address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
              startBlock: 0,
            } as PonderContract<typeof ENSTokenAbi>,
            ENSGovernor: {
              abi: ENSGovernorAbi,
              network: "anvil",
              address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
              startBlock: 0,
            } as PonderContract<typeof ENSGovernorAbi>,
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
            ARBToken: {
              abi: ARBTokenAbi,
              network: "anvil",
              address: zeroAddress,
              startBlock: 0,
            } as PonderContract<typeof ARBTokenAbi>,
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
    },
  },
};
