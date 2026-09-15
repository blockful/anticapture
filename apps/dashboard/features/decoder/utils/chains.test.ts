import {
  DEFAULT_DECODER_CHAIN_ID,
  isSupportedChainId,
  supportedDecoderChains,
  toSupportedChainId,
} from "@/features/decoder/utils/chains";

describe("supported decoder chains", () => {
  test("come from the indexed DAO configs, sorted and deduplicated", () => {
    const ids = supportedDecoderChains().map((chain) => chain.id);
    expect(ids).toContain(DEFAULT_DECODER_CHAIN_ID);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids]).toEqual([...ids].sort((a, b) => a - b));
  });

  test("an unindexed chain never reaches the ABI proxy", () => {
    expect(isSupportedChainId(9_999)).toBe(false);
    expect(toSupportedChainId(9_999)).toBe(DEFAULT_DECODER_CHAIN_ID);
    expect(toSupportedChainId(-1)).toBe(DEFAULT_DECODER_CHAIN_ID);
  });

  test("an indexed chain passes through untouched", () => {
    const [first] = supportedDecoderChains();
    expect(toSupportedChainId(first.id)).toBe(first.id);
  });
});
