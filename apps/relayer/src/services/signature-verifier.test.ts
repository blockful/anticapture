import { describe, it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { type Address, type Hex } from "viem";

import { SignatureVerifier } from "./signature-verifier";

const TEST_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const account = privateKeyToAccount(TEST_PK);

const GOVERNOR_DOMAIN = {
  name: "TestGovernor",
  version: "1",
  chainId: 1,
  verifyingContract: "0x1111111111111111111111111111111111111111" as Address,
};

const TOKEN_DOMAIN = {
  name: "TestToken",
  version: "1",
  chainId: 1,
  verifyingContract: "0x2222222222222222222222222222222222222222" as Address,
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

    // Extract v, r, s from the 65-byte signature
    const r = `0x${signature.slice(2, 66)}` as Hex;
    const s = `0x${signature.slice(66, 130)}` as Hex;
    const v = parseInt(signature.slice(130, 132), 16);

    const recovered = await verifier.recoverVoteSigner({
      proposalId,
      support,
      v,
      r,
      s,
    });

    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("recovers the correct signer from a delegation signature", async () => {
    const delegatee = "0x4444444444444444444444444444444444444444" as Address;
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

    const r = `0x${signature.slice(2, 66)}` as Hex;
    const s = `0x${signature.slice(66, 130)}` as Hex;
    const v = parseInt(signature.slice(130, 132), 16);

    const recovered = await verifier.recoverDelegationSigner({
      delegatee,
      nonce,
      expiry,
      v,
      r,
      s,
    });

    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("recovers a different address from a tampered signature", async () => {
    const badR =
      "0x0000000000000000000000000000000000000000000000000000000000000001" as Hex;
    const badS =
      "0x0000000000000000000000000000000000000000000000000000000000000002" as Hex;

    // recoverTypedDataAddress returns a different address, not the voter
    // The relay service will reject because recovered !== claimed voter
    const recovered = await verifier.recoverVoteSigner({
      proposalId: 1n,
      support: 1,
      v: 27,
      r: badR,
      s: badS,
    });

    expect(recovered.toLowerCase()).not.toBe(account.address.toLowerCase());
  });
});
