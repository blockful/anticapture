/* eslint-disable prettier/prettier */
import dotenv from "dotenv";
dotenv.config();
export const config = {
    production: {
        networks: {
            name: "mainnet",
            chainId: 1,
            rpcUrl1: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            rpcUrl2:
                `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`,
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
            rpcUrl1: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            rpcUrl2:
                `https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`,
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
};
