import { getKnownTokenMeta } from "@/shared/services/decoder/knownTokens";

const UNI_TOKEN = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const COMP_TOKEN = "0xc00e94Cb662C3520282E6f5717214004A7f26888";
const AAVE_TOKEN = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";
const STAKED_AAVE_TOKEN = "0x4da27a545c0c5B758a6BA100e3a049001de870f5";
const USDC_TOKEN = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const OP_TOKEN = "0x4200000000000000000000000000000000000042";

describe("getKnownTokenMeta", () => {
  test("a governance token reads as its ticker, never as the DAO name", () => {
    // "Transfers 25,000 Uniswap" is what the DAO display name produces, and
    // it renders immediately and stays if the symbol() read fails.
    expect(getKnownTokenMeta(1, UNI_TOKEN)).toEqual({
      symbol: "UNI",
      decimals: 18,
    });
    expect(getKnownTokenMeta(1, COMP_TOKEN)).toEqual({
      symbol: "COMP",
      decimals: 18,
    });
  });

  test("a DAO with several tokens uses each entry's own label", () => {
    expect(getKnownTokenMeta(1, AAVE_TOKEN)?.symbol).toBe("AAVE");
    expect(getKnownTokenMeta(1, STAKED_AAVE_TOKEN)?.symbol).toBe("stkAAVE");
  });

  test("lookups are case insensitive and chain scoped", () => {
    expect(getKnownTokenMeta(1, UNI_TOKEN.toLowerCase())?.symbol).toBe("UNI");
    // The same address on another chain is a different contract.
    expect(getKnownTokenMeta(10, UNI_TOKEN)).toBeUndefined();
    expect(getKnownTokenMeta(10, OP_TOKEN)?.symbol).toBe("OP");
  });

  test("curated stables keep their own symbol and decimals", () => {
    expect(getKnownTokenMeta(1, USDC_TOKEN)).toEqual({
      symbol: "USDC",
      decimals: 6,
    });
  });

  test("an unknown token has no static metadata", () => {
    expect(
      getKnownTokenMeta(1, "0x0000000000000000000000000000000000000001"),
    ).toBeUndefined();
  });
});
