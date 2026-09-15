import {
  RECIPIENT,
  SAFE_WRAPPING_AGGREGATE3,
  USDC,
  USDC_TRANSFER,
} from "@/shared/services/decoder/__fixtures__/calldata";
import { createAbiResolver } from "@/shared/services/decoder/abi/resolveAbi";
import { decodeCalldata } from "@/shared/services/decoder/decode";
import {
  applyTokenMeta,
  collectTokenHints,
  type TokenMeta,
} from "@/shared/services/decoder/enrich";

const offlineResolver = createAbiResolver({
  fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
  fetchSignatures: jest.fn().mockResolvedValue([]),
});

const USDC_META: ReadonlyMap<string, TokenMeta> = new Map([
  [USDC.toLowerCase(), { decimals: 6, symbol: "USDC" }],
]);

describe("collectTokenHints", () => {
  test("finds hinted tokens across nested subcalls, deduplicated", async () => {
    const node = await decodeCalldata(
      { chainId: 1, calldata: SAFE_WRAPPING_AGGREGATE3 },
      offlineResolver,
    );
    // The batch holds a transfer and an approve, both on USDC.
    expect(collectTokenHints(node)).toEqual([USDC.toLowerCase()]);
  });

  test("no hints -> empty", async () => {
    const node = await decodeCalldata(
      { chainId: 1, calldata: "0x" },
      offlineResolver,
    );
    expect(collectTokenHints(node)).toEqual([]);
  });
});

describe("applyTokenMeta", () => {
  test("rewrites hinted amounts and recomputes the summary", async () => {
    const node = await decodeCalldata(
      { chainId: 1, calldata: USDC_TRANSFER, target: USDC },
      offlineResolver,
    );
    const enriched = applyTokenMeta(node, USDC_META);

    expect(enriched.params[1].humanized?.text).toBe("25,000 USDC");
    expect(enriched.summary).toBe(
      `Transfers 25,000 USDC to ${RECIPIENT.slice(0, 6)}…${RECIPIENT.slice(-4)}.`,
    );
    // The original tree is untouched.
    expect(node.params[1].humanized?.text).toBe("25,000,000,000");
    expect(node.summary).toContain("(raw units)");
  });

  test("enriches nested subcalls", async () => {
    const node = await decodeCalldata(
      { chainId: 1, calldata: SAFE_WRAPPING_AGGREGATE3 },
      offlineResolver,
    );
    const enriched = applyTokenMeta(node, USDC_META);
    const transfer = enriched.subcalls![0].subcalls![0];
    expect(transfer.params[1].humanized?.text).toBe("25,000 USDC");
    expect(transfer.summary).toContain("25,000 USDC");
  });

  test("missing metadata leaves params untouched", async () => {
    const node = await decodeCalldata(
      { chainId: 1, calldata: USDC_TRANSFER, target: USDC },
      offlineResolver,
    );
    const enriched = applyTokenMeta(node, new Map());
    expect(enriched.params[1]).toBe(node.params[1]);
  });
});
