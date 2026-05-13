import { parseSignature, publicActions } from "viem";
import type {
  Address,
  Chain,
  PublicActions,
  WalletActions,
  WalletClient,
} from "viem";

import { relayDelegate } from "@anticapture/client";
import type { RelayDelegatePathParamsDaoEnumKey } from "@anticapture/client";

import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

const ERC20VotesAbi = [
  {
    inputs: [{ internalType: "address", name: "delegatee", type: "address" }],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const ERC20PermitReadAbi = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const DELEGATION_TYPES = {
  Delegation: [
    { name: "delegatee", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
} as const;

const DELEGATION_EXPIRY_SECONDS = 60 * 60; // 1 hour

type DelegateClient = WalletClient & PublicActions & WalletActions;

const gaslessDelegate = async (
  client: DelegateClient,
  daoId: DaoIdEnum,
  tokenAddress: Address,
  delegateAddress: Address,
  account: Address,
  onTxHash: (hash: `0x${string}`) => void,
) => {
  const config = daoConfigByDaoId[daoId];
  const chainId = config.daoOverview.chain.id;

  const [tokenName, nonce] = await Promise.all([
    client.readContract({
      abi: ERC20PermitReadAbi,
      address: tokenAddress,
      functionName: "name",
    }),
    client.readContract({
      abi: ERC20PermitReadAbi,
      address: tokenAddress,
      functionName: "nonces",
      args: [account],
    }),
  ]);

  const expiry = BigInt(
    Math.floor(Date.now() / 1000) + DELEGATION_EXPIRY_SECONDS,
  );

  const signature = await client.signTypedData({
    account,
    domain: {
      name: tokenName,
      version: "1",
      chainId,
      verifyingContract: tokenAddress,
    },
    types: DELEGATION_TYPES,
    primaryType: "Delegation",
    message: {
      delegatee: delegateAddress,
      nonce,
      expiry,
    },
  });

  const { r, s, v } = parseSignature(signature);
  if (v === undefined) throw new Error("Signature missing v");

  const response = await relayDelegate(
    daoId.toLowerCase() as RelayDelegatePathParamsDaoEnumKey,
    {
      delegatee: delegateAddress,
      nonce: nonce.toString(),
      expiry: expiry.toString(),
      r,
      s,
      v: Number(v),
    },
  );

  const hash = response.transactionHash as `0x${string}`;
  onTxHash(hash);
  return client.waitForTransactionReceipt({ hash });
};

export const delegateTo = async (
  tokenAddress: Address,
  delegateAddress: Address,
  account: Address,
  walletClient: WalletClient,
  onTxHash: (hash: `0x${string}`) => void,
  chain?: Chain,
  daoId?: DaoIdEnum,
  useGasless: boolean = false,
) => {
  const client = walletClient.extend(publicActions) as DelegateClient;

  if (useGasless && daoId && daoConfigByDaoId[daoId].gaslessRelayer) {
    return gaslessDelegate(
      client,
      daoId,
      tokenAddress,
      delegateAddress,
      account,
      onTxHash,
    );
  }

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
