import { encodeFunctionData, parseAbi, type Address, type Hex } from "viem";

import { createAbiResolver } from "@/shared/services/decoder/abi/resolveAbi";
import { createUploadedAbiStore } from "@/shared/services/decoder/abi/uploadedStore";

const TARGET = "0x00000000000000000000000000000000000000aa" as Address;
const RECIPIENT = "0x00000000000000000000000000000000000000bb" as Address;

const TRANSFER_ABI = parseAbi([
  "function transfer(address to, uint256 amount)",
]);

const TRANSFER_CALLDATA = encodeFunctionData({
  abi: TRANSFER_ABI,
  functionName: "transfer",
  args: [RECIPIENT, 25_000_000_000n],
});

const SELECTOR = TRANSFER_CALLDATA.slice(0, 10) as Hex;

const ctx = {
  chainId: 1,
  target: TARGET,
  selector: SELECTOR,
  calldata: TRANSFER_CALLDATA,
};

describe("createAbiResolver", () => {
  test("verified wins over uploaded and openchain", async () => {
    const uploaded = createUploadedAbiStore();
    uploaded.set([...TRANSFER_ABI], TARGET);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue([...TRANSFER_ABI]),
      fetchSignatures: jest
        .fn()
        .mockResolvedValue(["transfer(address,uint256)"]),
      uploaded,
    });

    const resolved = await resolver(ctx);
    expect(resolved?.source).toBe("verified");
    expect(resolved?.signature).toBe("transfer(address,uint256)");
  });

  test("uploaded overrides openchain when nothing is verified", async () => {
    const uploaded = createUploadedAbiStore();
    uploaded.set([...TRANSFER_ABI], TARGET);
    const fetchSignatures = jest.fn();
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures,
      uploaded,
    });

    const resolved = await resolver(ctx);
    expect(resolved?.source).toBe("uploaded");
    expect(fetchSignatures).not.toHaveBeenCalled();
  });

  test("a global uploaded ABI applies to targetless decodes", async () => {
    const uploaded = createUploadedAbiStore();
    uploaded.set([...TRANSFER_ABI]);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures: jest.fn().mockResolvedValue([]),
      uploaded,
    });

    const resolved = await resolver({ ...ctx, target: undefined });
    expect(resolved?.source).toBe("uploaded");
  });

  test("a global uploaded ABI never answers targeted lookups", async () => {
    // A wrapper's extracted children always carry concrete targets; the
    // root's pasted ABI must not preempt their own resolution.
    const uploaded = createUploadedAbiStore();
    uploaded.set([...TRANSFER_ABI]);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      getKnownFunction: () => null,
      fetchSignatures: jest.fn().mockResolvedValue([]),
      uploaded,
    });

    await expect(resolver(ctx)).resolves.toBeNull();
  });

  test("known canonical selectors resolve without any external source", async () => {
    const fetchSignatures = jest.fn();
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures,
    });

    const resolved = await resolver(ctx);
    expect(resolved?.source).toBe("known");
    expect(resolved?.signature).toBe("transfer(address,uint256)");
    expect(fetchSignatures).not.toHaveBeenCalled();
  });

  test("a failed verified lookup is retried on the next resolution", async () => {
    // First call fails (null), second succeeds: the resolver must not replay
    // the memoized failure forever.
    const fetchVerifiedAbi = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValue([...TRANSFER_ABI]);
    const resolver = createAbiResolver({
      fetchVerifiedAbi,
      fetchSignatures: jest.fn().mockResolvedValue([]),
    });

    const first = await resolver(ctx);
    expect(first?.source).toBe("known"); // degraded round: canonical fallback
    const second = await resolver(ctx);
    expect(second?.source).toBe("verified");
    expect(fetchVerifiedAbi).toHaveBeenCalledTimes(2);
  });

  test("the target's verified ABI outranks the known table on collisions", async () => {
    // 0x23b872dd is both transferFrom(address,address,uint256) and
    // gasprice_bit_ether(int128); a contract that verifiably implements the
    // latter must not decode as the canonical transferFrom.
    const GASPRICE_ABI = parseAbi(["function gasprice_bit_ether(int128 x)"]);
    const calldata = encodeFunctionData({
      abi: GASPRICE_ABI,
      functionName: "gasprice_bit_ether",
      args: [42n],
    });
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue([...GASPRICE_ABI]),
      fetchSignatures: jest.fn().mockResolvedValue([]),
    });

    const resolved = await resolver({
      ...ctx,
      selector: calldata.slice(0, 10) as Hex,
      calldata,
    });
    expect(resolved?.source).toBe("verified");
    expect(resolved?.signature).toBe("gasprice_bit_ether(int128)");
  });

  test("a known-table match that cannot decode falls through to openchain", async () => {
    // transferFrom's selector with a single word of arguments: the canonical
    // 3-arg shape does not decode it, the colliding 1-arg signature does.
    const calldata = `0x23b872dd${"2a".padStart(64, "0")}` as Hex;
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures: jest
        .fn()
        .mockResolvedValue(["gasprice_bit_ether(int128)"]),
    });

    const resolved = await resolver({
      ...ctx,
      selector: "0x23b872dd" as Hex,
      calldata,
    });
    expect(resolved?.source).toBe("openchain");
    expect(resolved?.signature).toBe("gasprice_bit_ether(int128)");
  });

  test("openchain candidates are validated by decoding, not taken first", async () => {
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      getKnownFunction: () => null,
      fetchSignatures: jest.fn().mockResolvedValue([
        // A junk entry that cannot decode this calldata must be skipped.
        "junk_entry(uint256,bytes32,bytes32,bytes32)",
        "transfer(address,uint256)",
      ]),
    });

    const resolved = await resolver(ctx);
    expect(resolved?.source).toBe("openchain");
    expect(resolved?.signature).toBe("transfer(address,uint256)");
    expect(resolved?.warning).toBeUndefined();
  });

  test("several decodable candidates flag ambiguity and keep the first", async () => {
    // The famous 4-byte collision: both signatures hash to 0x23b872dd.
    const TRANSFER_FROM_ABI = parseAbi([
      "function transferFrom(address from, address to, uint256 amount)",
    ]);
    const calldata = encodeFunctionData({
      abi: TRANSFER_FROM_ABI,
      functionName: "transferFrom",
      args: [TARGET, RECIPIENT, 1n],
    });
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      getKnownFunction: () => null,
      fetchSignatures: jest
        .fn()
        .mockResolvedValue([
          "transferFrom(address,address,uint256)",
          "gasprice_bit_ether(int128)",
        ]),
    });

    const resolved = await resolver({
      ...ctx,
      selector: calldata.slice(0, 10) as Hex,
      calldata,
    });
    expect(resolved?.signature).toBe("transferFrom(address,address,uint256)");
    expect(resolved?.warning?.code).toBe("openchain-ambiguous");
  });

  test("verified fetches dedupe per chain and target", async () => {
    const fetchVerifiedAbi = jest.fn().mockResolvedValue([...TRANSFER_ABI]);
    const resolver = createAbiResolver({ fetchVerifiedAbi });

    await Promise.all([resolver(ctx), resolver(ctx), resolver(ctx)]);
    expect(fetchVerifiedAbi).toHaveBeenCalledTimes(1);
  });

  test("openchain lookups dedupe per selector", async () => {
    const fetchSignatures = jest
      .fn()
      .mockResolvedValue(["transfer(address,uint256)"]);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      getKnownFunction: () => null,
      fetchSignatures,
    });

    await Promise.all([resolver(ctx), resolver(ctx)]);
    expect(fetchSignatures).toHaveBeenCalledTimes(1);
  });

  test("nothing resolves -> null", async () => {
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      getKnownFunction: () => null,
      fetchSignatures: jest.fn().mockResolvedValue([]),
    });
    await expect(resolver(ctx)).resolves.toBeNull();
  });
});
