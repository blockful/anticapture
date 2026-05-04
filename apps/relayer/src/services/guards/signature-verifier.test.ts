import { describe, it, expect } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getAddress, parseSignature } from "viem";

import { SignatureVerifier } from "./signature-verifier";

const account = privateKeyToAccount(generatePrivateKey());

const GOVERNOR_DOMAIN = {
  name: "TestGovernor",
  version: "1",
  chainId: 1,
  verifyingContract: getAddress("0x1111111111111111111111111111111111111111"),
};

const TOKEN_DOMAIN = {
  name: "TestToken",
  version: "1",
  chainId: 1,
  verifyingContract: getAddress("0x2222222222222222222222222222222222222222"),
};

describe("SignatureVerifier", () => {
  const verifier = new SignatureVerifier(GOVERNOR_DOMAIN, TOKEN_DOMAIN);

  it("recovers the correct signer from a vote signature", async () => {
    const proposalId = 1n;
    const support = 1; // for

    const signature = await account.signTypedData({
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

    const recovered = await verifier.recoverVoteSigner({
      proposalId,
      support,
      v: Number(v),
      r,
      s,
    });

    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("recovers the correct signer from a delegation signature", async () => {
    const delegatee = getAddress("0x4444444444444444444444444444444444444444");
    const nonce = 0n;
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);

    const signature = await account.signTypedData({
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

    const recovered = await verifier.recoverDelegationSigner({
      delegatee,
      nonce,
      expiry,
      v: Number(v),
      r,
      s,
    });

    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });
});
