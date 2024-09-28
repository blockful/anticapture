/* eslint-disable prettier/prettier */
import dotenv from "dotenv";
dotenv.config();

export const config = {
  production: {
    networks: {
      name: "mainnet",
      chainId: 1,
      rpcUrls: [process.env.PONDER_RPC_URL_1, process.env.PONDER_RPC_URL_2],
    },
    contracts: {
      ENSToken: {
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        startBlock: 9380410,
      },
      ENSGovernor: {
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        startBlock: 13533772,
      },
    },
  },
  staging: {
    networks: {
      name: "mainnet",
      chainId: 1,
      rpcUrls: [process.env.PONDER_RPC_URL_1, process.env.PONDER_RPC_URL_2],
    },
    contracts: {
      ENSToken: {
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        startBlock: 9380410,
      },
      ENSGovernor: {
        address: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
        startBlock: 13533772,
      },
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
      ENSToken: {
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        startBlock: 0,
      },
      ENSGovernor: {
        address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
        startBlock: 0,
      },
      ENSTimelockController: {
        address: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
      },
    },
  },
};
