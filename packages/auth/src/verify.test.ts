import { createSiweMessage } from "viem/siwe";
import { privateKeyToAccount } from "viem/accounts";
import { getAddress, type Hex } from "viem";
import { describe, expect, it } from "vitest";

import { memoryNonceStore } from "./stores/memory.js";
import {
  verifySiwe,
  verifySiweSignature,
  SiweVerificationError,
} from "./verify.js";

const DOMAIN = "example.com";
const CHAIN_ID = 1;
const account = privateKeyToAccount(
  "0x0facf9ffca9fdaea885fdc870edcd1064b89b7ff935b28896e242874ca380760",
);

const buildMessage = (
  overrides: Partial<Parameters<typeof createSiweMessage>[0]> = {},
) =>
  createSiweMessage({
    address: account.address,
    chainId: CHAIN_ID,
    domain: DOMAIN,
    nonce: "abcdefgh12345678",
    uri: `https://${DOMAIN}`,
    version: "1",
    ...overrides,
  });

const sign = async (message: string): Promise<Hex> =>
  account.signMessage({ message });

/** Flips a hex nibble inside the `r` component of a 65-byte signature. */
const tamperSignature = (signature: Hex): Hex => {
  const prefix = signature.slice(0, 10);
  const flipped = prefix.at(-1) === "0" ? "1" : "0";
  return `${prefix.slice(0, -1)}${flipped}${signature.slice(10)}` as Hex;
};

describe("verifySiweSignature (EOA)", () => {
  it("accepts a valid EOA signature", async () => {
    const message = buildMessage();
    const signature = await sign(message);

    const result = await verifySiweSignature({ message, signature });

    expect(result.address).toBe(getAddress(account.address));
  });

  it("rejects a tampered signature", async () => {
    const message = buildMessage();
    const signature = await sign(message);
    const tampered = tamperSignature(signature);

    await expect(
      verifySiweSignature({ message, signature: tampered }),
    ).rejects.toMatchObject({ reason: "bad_signature" });
  });

  // EIP-1271 smart-contract-wallet verification requires an on-chain
  // contract (e.g. a deployed Safe) reachable via a viem `Client`. Exercising
  // that path here would require an Anvil mainnet fork (see
  // apps/relayer/e2e/helpers/anvil.ts), which needs a live RPC_URL and is
  // e2e-grade infra unsuited to this package's portable unit suite. The
  // `client`-injected branch in `verifySiweSignature` delegates directly to
  // viem's `verifySiweMessage`, which viem itself tests against real
  // ERC-1271/ERC-6492 contracts; wiring an equivalent fork-based test here is
  // deferred to the authful/draft-proposals adoption work (see plan
  // Follow-ups) where a real RPC fixture already exists.
  it.skip("accepts a valid EIP-1271 smart-contract-wallet signature (requires anvil fork, see comment)", () => {
    // Intentionally left unimplemented — see comment above.
  });
});

describe("verifySiwe", () => {
  const setup = () => {
    const store = memoryNonceStore();
    const message = buildMessage();
    return { store, message };
  };

  it("accepts a valid message exactly once", async () => {
    const { store, message } = setup();
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);

    const result = await verifySiwe({
      message,
      signature,
      store,
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });

    expect(result.address).toBe(getAddress(account.address));

    // Second attempt with the same (now-consumed) nonce must fail.
    await expect(
      verifySiwe({
        message,
        signature,
        store,
        expectedDomain: DOMAIN,
        expectedChainId: CHAIN_ID,
      }),
    ).rejects.toMatchObject({ reason: "nonce" });
  });

  it("rejects an unknown nonce", async () => {
    const { store, message } = setup();
    const signature = await sign(message);

    await expect(
      verifySiwe({
        message,
        signature,
        store,
        expectedDomain: DOMAIN,
        expectedChainId: CHAIN_ID,
      }),
    ).rejects.toMatchObject({ reason: "nonce" });
  });

  it("rejects a wrong domain", async () => {
    const { store, message } = setup();
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);

    await expect(
      verifySiwe({
        message,
        signature,
        store,
        expectedDomain: "other.example",
        expectedChainId: CHAIN_ID,
      }),
    ).rejects.toMatchObject({ reason: "invalid_message" });
  });

  it("accepts any domain from an allowlist", async () => {
    const { store, message } = setup();
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);

    const result = await verifySiwe({
      message,
      signature,
      store,
      expectedDomain: ["other.example", DOMAIN],
      expectedChainId: CHAIN_ID,
    });

    expect(result.address).toBe(getAddress(account.address));
  });

  it("rejects a domain absent from the allowlist", async () => {
    const { store, message } = setup();
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);

    await expect(
      verifySiwe({
        message,
        signature,
        store,
        expectedDomain: ["other.example", "another.example"],
        expectedChainId: CHAIN_ID,
      }),
    ).rejects.toMatchObject({ reason: "invalid_message" });

    // The nonce must survive a domain rejection (consume is the last gate).
    await expect(store.consume("abcdefgh12345678")).resolves.toBe(true);
  });

  it("throws a plain Error (not a verification error) on an empty allowlist", async () => {
    const { store, message } = setup();
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);

    const attempt = verifySiwe({
      message,
      signature,
      store,
      expectedDomain: [],
      expectedChainId: CHAIN_ID,
    });

    await expect(attempt).rejects.toThrow("expectedDomain must not be empty");
    await expect(attempt).rejects.not.toBeInstanceOf(SiweVerificationError);
  });

  it("rejects a wrong chainId", async () => {
    const { store, message } = setup();
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);

    await expect(
      verifySiwe({
        message,
        signature,
        store,
        expectedDomain: DOMAIN,
        expectedChainId: 999,
      }),
    ).rejects.toMatchObject({ reason: "wrong_chain" });
  });

  it("rejects an expired message", async () => {
    const store = memoryNonceStore();
    const issuedAt = new Date("2020-01-01T00:00:00.000Z");
    const expirationTime = new Date("2020-01-01T00:05:00.000Z");
    const message = buildMessage({ issuedAt, expirationTime });
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);

    await expect(
      verifySiwe({
        message,
        signature,
        store,
        expectedDomain: DOMAIN,
        expectedChainId: CHAIN_ID,
        time: new Date("2020-01-01T00:10:00.000Z"),
      }),
    ).rejects.toMatchObject({ reason: "invalid_message" });
  });

  it("rejects a not-yet-valid message", async () => {
    const store = memoryNonceStore();
    const issuedAt = new Date("2020-01-01T00:00:00.000Z");
    const notBefore = new Date("2020-01-01T01:00:00.000Z");
    const message = buildMessage({ issuedAt, notBefore });
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);

    await expect(
      verifySiwe({
        message,
        signature,
        store,
        expectedDomain: DOMAIN,
        expectedChainId: CHAIN_ID,
        time: new Date("2020-01-01T00:30:00.000Z"),
      }),
    ).rejects.toMatchObject({ reason: "invalid_message" });
  });

  it("does not consume the nonce when the signature is invalid", async () => {
    const { store, message } = setup();
    await store.issue("abcdefgh12345678");
    const signature = await sign(message);
    const tampered = tamperSignature(signature);

    await expect(
      verifySiwe({
        message,
        signature: tampered,
        store,
        expectedDomain: DOMAIN,
        expectedChainId: CHAIN_ID,
      }),
    ).rejects.toMatchObject({ reason: "bad_signature" });

    // Nonce must still be available since verification failed before consume.
    await expect(store.consume("abcdefgh12345678")).resolves.toBe(true);
  });

  it("throws a SiweVerificationError instance", async () => {
    const { store, message } = setup();
    const signature = await sign(message);

    await expect(
      verifySiwe({
        message,
        signature,
        store,
        expectedDomain: DOMAIN,
        expectedChainId: CHAIN_ID,
      }),
    ).rejects.toBeInstanceOf(SiweVerificationError);
  });
});
