/* eslint-disable prettier/prettier */
import dotenv from "dotenv";
dotenv.config();
export const config = {
    production: {
        networks: {
            name: "mainnet",
            chainId: 1,
            rpcUrl1: `http://127.0.0.1:8545`,
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
            UNIToken: {
                address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                startBlock: 10861674,
            },
            COMPToken: {
                address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
                startBlock: 9601359,
            },
        },
    },
    staging: {
        networks: {
            name: "mainnet",
            chainId: 1,
            rpcUrl1: `http://127.0.0.1:8545`,
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
            UNIToken: {
                address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
                startBlock: 10861674,
            },
            COMPToken: {
                address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
                startBlock: 9601359,
            },
        },
    },
}
