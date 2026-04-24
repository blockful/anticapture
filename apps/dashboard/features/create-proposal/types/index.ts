import type { Abi } from "viem";

export type EthTransferAction = {
  type: "eth-transfer";
  recipient: string;
  amount: string; // ETH as decimal string (e.g. "1.5")
};

export type ERC20TransferAction = {
  type: "erc20-transfer";
  recipient: string;
  tokenAddress: string;
  amount: string;
  decimals: number;
};

export type CustomAction = {
  type: "custom";
  contractAddress: string;
  abi: Abi;
  functionName: string;
  args: string[];
  /** Raw calldata when the user provided it directly instead of an ABI. */
  calldata?: string;
  /** ETH value (in wei, as string) to send with the call. Defaults to "0". */
  value?: string;
};

export type ProposalAction =
  | EthTransferAction
  | ERC20TransferAction
  | CustomAction;

export type ProposalDraft = {
  id: string;
  daoId: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  discussionUrl: string;
  body: string;
  actions: ProposalAction[];
};
