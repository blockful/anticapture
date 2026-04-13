import { publicActions } from "viem";
import type { Account, Address, WalletClient } from "viem";

const ERC20VotesAbi = [
  {
    inputs: [{ internalType: "address", name: "delegatee", type: "address" }],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const delegateTo = async (
  tokenAddress: Address,
  delegateAddress: Address,
  account: Account,
  walletClient: WalletClient,
  onTxHash: (hash: `0x${string}`) => void,
) => {
  const client = walletClient.extend(publicActions);

  const { request } = await client.simulateContract({
    abi: ERC20VotesAbi,
    address: tokenAddress,
    functionName: "delegate",
    args: [delegateAddress],
    account,
  });

  const hash = await client.writeContract(request);
  onTxHash(hash);

  const receipt = await client.waitForTransactionReceipt({ hash });
  return receipt;
};
