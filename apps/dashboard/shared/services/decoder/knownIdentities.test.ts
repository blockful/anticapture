import { resolveKnownIdentity } from "@/shared/services/decoder/knownIdentities";

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const ENS_TOKEN = "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72";
const ENS_GOVERNOR = "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3";
const ENS_TIMELOCK = "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7";
const WALLET = "0x93a8f8072337F2D1Ff2D019761cE0ABa39723d7B";

describe("resolveKnownIdentity", () => {
  test("a curated token reads as its ticker with a logo", () => {
    expect(resolveKnownIdentity(1, USDC)).toEqual({
      label: "USDC",
      isToken: true,
      logoUri: expect.stringContaining("trustwallet"),
    });
  });

  test("a DAO's own token carries the DAO logo, not a token logo", () => {
    const identity = resolveKnownIdentity(1, ENS_TOKEN);
    expect(identity).toMatchObject({
      label: "ENS Token",
      isToken: true,
      daoId: "ENS",
    });
    expect(identity?.logoUri).toBeUndefined();
  });

  test("governance contracts are named by role", () => {
    expect(resolveKnownIdentity(1, ENS_GOVERNOR)).toMatchObject({
      label: "ENS Governor",
      isToken: false,
      daoId: "ENS",
    });
    expect(resolveKnownIdentity(1, ENS_TIMELOCK)?.label).toBe("ENS Timelock");
  });

  test("lookups are case insensitive and chain scoped", () => {
    expect(resolveKnownIdentity(1, USDC.toLowerCase())?.label).toBe("USDC");
    // Mainnet USDC's address is another contract, or nothing, on Optimism.
    expect(resolveKnownIdentity(10, USDC)).toBeUndefined();
  });

  test("an unknown address is left to the enrichment service", () => {
    expect(resolveKnownIdentity(1, WALLET)).toBeUndefined();
  });
});
