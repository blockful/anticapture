import { Address, Hex, recoverTypedDataAddress } from "viem";

import { Errors } from "@/errors";

export interface ISignatureVerifier {
  recoverVoteSigner(params: {
    proposalId: bigint;
    support: number;
    v: number;
    r: Hex;
    s: Hex;
    expectedVoter?: Address;
  }): Promise<Address>;

  recoverDelegationSigner(params: {
    delegatee: Address;
    nonce: bigint;
    expiry: bigint;
    v: number;
    r: Hex;
    s: Hex;
  }): Promise<Address>;
}

/**
 * EIP-712 typed data for Governor.castVoteBySig.
 * - proposalId: the governance proposal being voted on
 * - support: 0 = Against, 1 = For, 2 = Abstain
 */
const BALLOT_TYPES = {
  Ballot: [
    { name: "proposalId", type: "uint256" },
    { name: "support", type: "uint8" },
  ],
} as const;

/**
 * EIP-712 typed data for ERC20Votes.delegateBySig.
 * - delegatee: address receiving the voting power
 * - nonce: signer's current nonce (replay protection)
 * - expiry: unix timestamp after which the signature is invalid
 */
const DELEGATION_TYPES = {
  Delegation: [
    { name: "delegatee", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
} as const;

type EIP712Domain = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
};

export class SignatureVerifier implements ISignatureVerifier {
  constructor(
    private governorDomain: EIP712Domain,
    private tokenDomain: EIP712Domain,
  ) {}

  /**
   * Recover the voter address from a castVoteBySig EIP-712 signature.
   * Note: recoverTypedDataAddress always returns an address (ECDSA recovery
   * always produces a result). If the signature is tampered, it returns a
   * *different* address — not nothing. The on-chain contract will also recover
   * and revert if invalid. We optionally accept expectedVoter for a pre-flight
   * check to avoid wasting gas on obviously wrong signatures.
   */
  async recoverVoteSigner(params: {
    proposalId: bigint;
    support: number;
    v: number;
    r: Hex;
    s: Hex;
    expectedVoter?: Address;
  }): Promise<Address> {
    const { proposalId, support, v, r, s, expectedVoter } = params;

    const signature = this.vrsToSignature(v, r, s);

    const recovered = await recoverTypedDataAddress({
      domain: this.governorDomain,
      types: BALLOT_TYPES,
      primaryType: "Ballot",
      message: { proposalId, support },
      signature,
    });

    if (
      expectedVoter &&
      recovered.toLowerCase() !== expectedVoter.toLowerCase()
    ) {
      throw Errors.INVALID_SIGNATURE();
    }

    return recovered;
  }

  async recoverDelegationSigner(params: {
    delegatee: Address;
    nonce: bigint;
    expiry: bigint;
    v: number;
    r: Hex;
    s: Hex;
  }): Promise<Address> {
    const { delegatee, nonce, expiry, v, r, s } = params;

    const signature = this.vrsToSignature(v, r, s);

    return recoverTypedDataAddress({
      domain: this.tokenDomain,
      types: DELEGATION_TYPES,
      primaryType: "Delegation",
      message: { delegatee, nonce, expiry },
      signature,
    });
  }

  private vrsToSignature(v: number, r: Hex, s: Hex): Hex {
    // Concatenate r + s + v into a 65-byte signature
    const rClean = r.slice(2);
    const sClean = s.slice(2);
    const vHex = v.toString(16).padStart(2, "0");
    const signature: Hex = `0x${rClean}${sClean}${vHex}`;
    return signature;
  }
}
