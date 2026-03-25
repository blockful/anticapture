import { publicActions } from "viem";
import type { Address, Chain, WalletClient } from "viem";

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
  account: Address,
  walletClient: WalletClient,
  onTxHash: (hash: `0x${string}`) => void,
  chain?: Chain,
) => {
  const client = walletClient.extend(publicActions);

  const { request } = await client.simulateContract({
    abi: ERC20VotesAbi,
    address: tokenAddress,
    functionName: "delegate",
    args: [delegateAddress],
    account,
    chain,
  });

  const hash = await client.writeContract(request);
  onTxHash(hash);

  const receipt = await client.waitForTransactionReceipt({ hash });
  return receipt;
};
