import { DaoIdEnum } from "@/shared/types/daos";
import { Address } from "viem";

/* MOCK DATA */
interface HistoricalBalance {
  address: string | Address;
  balance: number;
  blockNumber: number;
  tokenAddress: string | Address;
}

export const historicalBalancesMock: HistoricalBalance[] = [
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    balance: 10000000000000000000,
    blockNumber: 22635115,
    tokenAddress: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
  },
];

interface TokenHoldersResponse {
  accountId: string | Address;
  balance: number;
  daoId: DaoIdEnum;
  delegate: string | Address;
  id: string;
  tokenId: string | Address;
  account: {
    type: "Contract" | "EOA";
  };
}

export const tokenHoldersMock: TokenHoldersResponse[] = [
  {
    accountId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    balance: 20,
    daoId: DaoIdEnum.ENS,
    delegate: "0x0000000000000000000000000000000000000000",
    id: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52-0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    tokenId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    account: {
      type: "Contract",
    },
  },
  {
    accountId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    balance: 200000000000000000000,
    daoId: DaoIdEnum.ENS,
    delegate: "0x0000000000000000000000000000000000000000",
    id: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52-0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    tokenId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    account: {
      type: "EOA",
    },
  },
  {
    accountId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    balance: 200000000000000000000,
    daoId: DaoIdEnum.ENS,
    delegate: "0x0000000000000000000000000000000000000000",
    id: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52-0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    tokenId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    account: {
      type: "EOA",
    },
  },
  {
    accountId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    balance: 200000000000000000000,
    daoId: DaoIdEnum.ENS,
    delegate: "0x0000000000000000000000000000000000000000",
    id: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52-0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    tokenId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    account: {
      type: "EOA",
    },
  },
  {
    accountId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    balance: 200000000000000000000,
    daoId: DaoIdEnum.ENS,
    delegate: "0x0000000000000000000000000000000000000000",
    id: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52-0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    tokenId: "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52",
    account: {
      type: "Contract",
    },
  },
];
