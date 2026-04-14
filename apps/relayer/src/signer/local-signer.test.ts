import { describe, it, expect } from "vitest";
import { mainnet } from "viem/chains";

import { createLocalSigner } from "./local-signer";

// Known test private key (DO NOT use in production)
const TEST_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const EXPECTED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("createLocalSigner", () => {
  it("derives the correct address from private key", () => {
    const signer = createLocalSigner(TEST_PK, mainnet, "http://localhost:8545");
    expect(signer.address.toLowerCase()).toBe(EXPECTED_ADDRESS.toLowerCase());
  });

  it("exposes a sendTransaction method", () => {
    const signer = createLocalSigner(TEST_PK, mainnet, "http://localhost:8545");
    expect(typeof signer.sendTransaction).toBe("function");
  });
});
