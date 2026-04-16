import { parseSignature, type Address, type Hex } from "viem";
import { signTypedData } from "viem/accounts";

import type { RelayDelegateRequest } from "@/schemas/relay-delegate";
import type { RelayVoteRequest } from "@/schemas/relay-vote";

import { GOVERNOR_DOMAIN, TOKEN_DOMAIN } from "./constants";

interface SignDelegationParams {
  privateKey: Hex;
  delegatee: Address;
  nonce: bigint;
  expiry: bigint;
}

/**
 * Signs an EIP-712 Delegation message with the token domain and returns
 * the full POST body for `/relay/delegate`. Guarantees the signature and
 * the body fields stay in sync.
 */
export async function signDelegation({
  privateKey,
  delegatee,
  nonce,
  expiry,
}: SignDelegationParams): Promise<RelayDelegateRequest> {
  const signature = await signTypedData({
    privateKey,
    domain: TOKEN_DOMAIN,
    types: {
      Delegation: [
        { name: "delegatee", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
      ],
    },
    primaryType: "Delegation",
    message: { delegatee, nonce, expiry },
  });

  const { r, s, v } = parseSignature(signature);

  return {
    delegatee,
    nonce: nonce.toString(),
    expiry: expiry.toString(),
    v: Number(v),
    r,
    s,
  };
}

interface SignVoteParams {
  privateKey: Hex;
  proposalId: bigint;
  support: number;
}

/**
 * Signs an EIP-712 Ballot message with the governor domain and returns
 * the full POST body for `/relay/vote`.
 */
export async function signVote({
  privateKey,
  proposalId,
  support,
}: SignVoteParams): Promise<RelayVoteRequest> {
  const signature = await signTypedData({
    privateKey,
    domain: GOVERNOR_DOMAIN,
    types: {
      Ballot: [
        { name: "proposalId", type: "uint256" },
        { name: "support", type: "uint8" },
      ],
    },
    primaryType: "Ballot",
    message: { proposalId, support },
  });

  const { r, s, v } = parseSignature(signature);

  return {
    proposalId: proposalId.toString(),
    support,
    v: Number(v),
    r,
    s,
  };
}
