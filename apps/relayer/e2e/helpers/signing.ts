import { parseSignature, type Address, type Hex } from "viem";
import { signTypedData } from "viem/accounts";

import type { RelayDelegateRequest } from "@/schemas/relay-delegate";

import { TOKEN_DOMAIN } from "./constants";

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
