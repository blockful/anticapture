import { encodeFunctionData, parseAbi, type Address, type Hex } from "viem";

import {
  AGGREGATE3_BATCH,
  MULTICALL3,
  RECIPIENT,
  SAFE,
  SAFE_WRAPPING_AGGREGATE3,
  safeExecTransaction,
  SCHEDULE_BATCH,
  TIMELOCK,
  USDC,
  USDC_TRANSFER,
} from "@/shared/services/decoder/__fixtures__/calldata";
import { createAbiResolver } from "@/shared/services/decoder/abi/resolveAbi";
import { createUploadedAbiStore } from "@/shared/services/decoder/abi/uploadedStore";
import {
  decodeCalldata,
  isDegradedDecode,
} from "@/shared/services/decoder/decode";

// Every external source empty: only known selectors and uploads resolve.
const offlineResolver = createAbiResolver({
  fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
  fetchSignatures: jest.fn().mockResolvedValue([]),
});

const decode = (
  calldata: string,
  extra?: { target?: Address; value?: bigint },
) => decodeCalldata({ chainId: 1, calldata, ...extra }, offlineResolver);

describe("decodeCalldata basics", () => {
  test("an ERC20 transfer decodes via the known-selector table", async () => {
    const node = await decode(USDC_TRANSFER, { target: USDC });
    expect(node.abiSource).toBe("known");
    expect(node.functionName).toBe("transfer");
    expect(node.signature).toBe("transfer(address,uint256)");
    expect(node.params).toHaveLength(2);
    expect(node.params[0]).toMatchObject({
      name: "to",
      type: "address",
      value: RECIPIENT,
      isAddress: true,
    });
    expect(node.params[1]).toMatchObject({
      name: "amount",
      value: "25000000000",
      tokenHint: { token: USDC },
    });
    expect(node.summary).toBe(
      `Transfers 25,000,000,000 (raw units) to ${RECIPIENT.slice(0, 6)}…${RECIPIENT.slice(-4)}.`,
    );
  });

  test("no target still decodes but cannot hint a token", async () => {
    const node = await decode(USDC_TRANSFER);
    expect(node.functionName).toBe("transfer");
    expect(node.params[1].tokenHint).toBeUndefined();
  });

  test("an ERC-721 shaped approve is a token ID, never a fungible amount", async () => {
    // approve(address,uint256) is shared between ERC-20 and ERC-721; when the
    // target's own ABI names the param tokenId, the fungible hint (and its
    // decimals lookup) must not apply and the sentence must say token #N.
    const nftAbi = parseAbi(["function approve(address to, uint256 tokenId)"]);
    const calldata = encodeFunctionData({
      abi: nftAbi,
      functionName: "approve",
      args: [RECIPIENT, 42n],
    });
    const uploaded = createUploadedAbiStore();
    uploaded.set([...nftAbi], SAFE);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures: jest.fn().mockResolvedValue([]),
      uploaded,
    });

    const node = await decodeCalldata(
      { chainId: 1, calldata, target: SAFE },
      resolver,
    );
    expect(node.params[1].name).toBe("tokenId");
    expect(node.params[1].tokenHint).toBeUndefined();
    expect(node.summary).toBe(
      `Approves ${RECIPIENT.slice(0, 6)}…${RECIPIENT.slice(-4)} to manage token #42.`,
    );
  });

  test("nested tuples and arrays become children with a rail-ready tree", async () => {
    const abi = parseAbi([
      "function createStream(address recipient, (uint256 cliff, uint256 total)[] schedules)",
    ]);
    const calldata = encodeFunctionData({
      abi,
      functionName: "createStream",
      args: [RECIPIENT, [{ cliff: 2_592_000n, total: 7_776_000n }]],
    });
    const uploaded = createUploadedAbiStore();
    uploaded.set([...abi]);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures: jest.fn().mockResolvedValue([]),
      uploaded,
    });

    const node = await decodeCalldata({ chainId: 1, calldata }, resolver);
    expect(node.abiSource).toBe("uploaded");
    const schedules = node.params[1];
    expect(schedules.type).toBe("tuple[]");
    expect(schedules.children).toHaveLength(1);
    expect(schedules.children?.[0].children).toEqual([
      expect.objectContaining({ name: "cliff", value: "2592000" }),
      expect.objectContaining({ name: "total", value: "7776000" }),
    ]);
  });

  test("a huge array keeps the first elements plus a not-shown marker", async () => {
    // A valid ABI with a large dynamic array must not materialize thousands
    // of rows (each address row also costs an enrichment query downstream).
    const abi = parseAbi(["function airdrop(address[] recipients)"]);
    const calldata = encodeFunctionData({
      abi,
      functionName: "airdrop",
      args: [Array.from({ length: 250 }, () => RECIPIENT)],
    });
    const uploaded = createUploadedAbiStore();
    uploaded.set([...abi]);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures: jest.fn().mockResolvedValue([]),
      uploaded,
    });

    const node = await decodeCalldata({ chainId: 1, calldata }, resolver);
    const recipients = node.params[0];
    expect(recipients.value).toBe("250 items");
    expect(recipients.children).toHaveLength(101);
    expect(recipients.children?.[99]).toMatchObject({
      name: "[99]",
      value: RECIPIENT,
    });
    expect(recipients.children?.[100]).toMatchObject({
      name: "…",
      value: "150 more items not shown",
    });
  });

  test("unknown selector degrades to guessed words with a permanent warning", async () => {
    const node = await decode(`0xdeadbeef${"1".padStart(64, "0")}`);
    expect(node.abiSource).toBe("none");
    expect(node.selector).toBe("0xdeadbeef");
    expect(node.params).toEqual([
      expect.objectContaining({ name: "arg0", value: "1" }),
    ]);
    expect(node.warnings).toEqual([
      expect.objectContaining({ code: "guessed-types" }),
    ]);
  });

  test("malformed hex preserves the input verbatim as an error node", async () => {
    const node = await decode("0xdeadbeef123"); // odd length
    expect(node.error).toContain("Not valid calldata");
    expect(node.raw).toBe("0xdeadbeef123");
    expect(node.selector).toBe("0xdeadbeef");
  });

  test("calldata shorter than a selector errors without a selector", async () => {
    const node = await decode("0x0102");
    expect(node.selector).toBeNull();
    expect(node.error).toContain("shorter than a 4-byte");
  });

  test("empty calldata with value is a plain ETH transfer", async () => {
    const node = await decode("0x", {
      target: RECIPIENT,
      value: 1_500_000_000_000_000_000n,
    });
    expect(node.selector).toBeNull();
    expect(node.error).toBeUndefined();
    expect(node.summary).toBe(
      `Transfers 1.5 ETH to ${RECIPIENT.slice(0, 6)}…${RECIPIENT.slice(-4)}.`,
    );
  });

  test("oversized calldata keeps only selector and raw", async () => {
    const huge = `0xa9059cbb${"ab".repeat(200)}`;
    const node = await decodeCalldata(
      { chainId: 1, calldata: huge },
      offlineResolver,
      { maxBytes: 100 },
    );
    expect(node.selector).toBe("0xa9059cbb");
    expect(node.params).toEqual([]);
    expect(node.warnings).toEqual([
      expect.objectContaining({ code: "size-limit" }),
    ]);
    expect(node.raw).toBe(huge);
  });
});

describe("multicall unpacking", () => {
  test("Safe execTransaction wrapping Multicall3.aggregate3 unpacks two levels", async () => {
    const node = await decode(SAFE_WRAPPING_AGGREGATE3, { target: SAFE });
    expect(node.functionName).toBe("execTransaction");
    expect(node.summary).toBe("Executes 1 call.");
    expect(node.subcalls).toHaveLength(1);

    const inner = node.subcalls![0];
    expect(inner).toMatchObject({
      index: 0,
      depth: 1,
      target: MULTICALL3,
      functionName: "aggregate3",
      summary: "Executes 2 calls.",
    });
    expect(inner.subcalls).toHaveLength(2);
    expect(inner.subcalls![0]).toMatchObject({
      depth: 2,
      target: USDC,
      functionName: "transfer",
    });
    expect(inner.subcalls![0].params[1].tokenHint).toEqual({ token: USDC });
    expect(inner.subcalls![1]).toMatchObject({ functionName: "approve" });
  });

  test("a Safe delegatecall is flagged and carries no ETH into the child", async () => {
    const node = await decode(safeExecTransaction(USDC, USDC_TRANSFER, 1));
    expect(node.warnings).toEqual([
      expect.objectContaining({ code: "delegatecall" }),
    ]);
    // Delegatecall transfers nothing and runs with the Safe's storage: the
    // child must not carry the value and must repeat the caveat where its
    // effects are shown.
    const child = node.subcalls![0];
    expect(child.value).toBeUndefined();
    expect(child.warnings).toEqual([
      expect.objectContaining({ code: "delegatecall" }),
    ]);
  });

  test("scheduleBatch fans out and an empty-calldata entry becomes an ETH node", async () => {
    const node = await decode(SCHEDULE_BATCH, { target: TIMELOCK });
    expect(node.summary).toBe("Schedules 2 calls.");
    expect(node.subcalls).toHaveLength(2);
    expect(node.subcalls![0]).toMatchObject({
      target: USDC,
      functionName: "transfer",
    });
    const ethLeg = node.subcalls![1];
    expect(ethLeg.selector).toBeNull();
    expect(ethLeg.summary).toContain("Transfers 1.5 ETH");
    // The batch delay param reads as a duration.
    expect(node.params[5].humanized?.text).toBe("2 days = 172,800 seconds");
  });

  test("a batch with mismatched array lengths degrades missing payloads to empty calls", async () => {
    const abi = parseAbi([
      "function scheduleBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt, uint256 delay)",
    ]);
    const zero32 = `0x${"0".repeat(64)}` as Hex;
    // Two targets, one payload: hand-crafted calldata can disagree like this.
    const calldata = encodeFunctionData({
      abi,
      functionName: "scheduleBatch",
      args: [[USDC, RECIPIENT], [0n, 1n], [USDC_TRANSFER], zero32, zero32, 60n],
    });

    const node = await decode(calldata, { target: TIMELOCK });
    expect(node.subcalls).toHaveLength(2);
    expect(node.subcalls![0].functionName).toBe("transfer");
    // The missing payload becomes an empty call, not a crash or a blank tree.
    expect(node.subcalls![1].raw).toBe("0x");
    expect(node.subcalls![1].error).toBeUndefined();
  });

  test("recursion stops at maxDepth and leaves deeper calls raw", async () => {
    // relay(relay(relay(...transfer))) six levels deep.
    let calldata: Hex = USDC_TRANSFER;
    const relayAbi = parseAbi([
      "function relay(address target, uint256 value, bytes data)",
    ]);
    for (let i = 0; i < 6; i++) {
      calldata = encodeFunctionData({
        abi: relayAbi,
        functionName: "relay",
        args: [USDC, 0n, calldata],
      });
    }

    let node = await decode(calldata);
    for (let depth = 1; depth <= 5; depth++) {
      expect(node.subcalls).toHaveLength(1);
      expect(node.functionName).toBe("relay");
      node = node.subcalls![0];
      expect(node.depth).toBe(depth);
    }
    // Depth 5 is the last decoded level; its child at depth 6 stays raw.
    const rawChild = node.subcalls![0];
    expect(rawChild.depth).toBe(6);
    expect(rawChild.warnings).toEqual([
      expect.objectContaining({ code: "depth-limit" }),
    ]);
    expect(rawChild.params).toEqual([]);
    expect(rawChild.raw).toBe(USDC_TRANSFER);
  });

  test("independent batch children decode concurrently, in order", async () => {
    let active = 0;
    let maxActive = 0;
    const trackingResolver: Parameters<typeof decodeCalldata>[1] = async (
      ctx,
    ) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;
      return offlineResolver(ctx);
    };

    const node = await decodeCalldata(
      { chainId: 1, calldata: AGGREGATE3_BATCH, target: MULTICALL3 },
      trackingResolver,
    );
    // Two children resolved in parallel, original order preserved.
    expect(maxActive).toBeGreaterThan(1);
    expect(node.subcalls?.map((subcall) => subcall.functionName)).toEqual([
      "transfer",
      "approve",
    ]);
    expect(node.subcalls?.map((subcall) => subcall.index)).toEqual([0, 1]);
  });

  test("the node budget splits deterministically across sibling batches", async () => {
    // Two sibling inner batches under one outer batch, with room for only one
    // grandchild each: the split must come out [1, 1] on every run, never
    // [2, 0] decided by whichever network lookup finished first.
    const MULTICALL3_ABI = parseAbi([
      "function aggregate3((address target, bool allowFailure, bytes callData)[] calls)",
    ]);
    const inner = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      args: [
        [
          { target: USDC, allowFailure: false, callData: USDC_TRANSFER },
          { target: USDC, allowFailure: false, callData: USDC_TRANSFER },
        ],
      ],
    });
    const outer = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      args: [
        [
          { target: MULTICALL3, allowFailure: false, callData: inner },
          { target: MULTICALL3, allowFailure: false, callData: inner },
        ],
      ],
    });

    const node = await decodeCalldata(
      { chainId: 1, calldata: outer },
      offlineResolver,
      { maxNodes: 4 },
    );
    const grandchildCounts = node.subcalls?.map(
      (subcall) => subcall.subcalls?.length ?? 0,
    );
    expect(grandchildCounts).toEqual([1, 1]);
    for (const subcall of node.subcalls ?? []) {
      expect(subcall.warnings).toEqual([
        expect.objectContaining({ code: "size-limit" }),
      ]);
    }
  });

  test("an empty wrapper hands its whole budget back to siblings", async () => {
    // Outer batch = [empty inner batch, 3-transfer inner batch] with room for
    // exactly the whole tree: the empty wrapper allocates no shares and must
    // not discard the branch's remaining budget.
    const MULTICALL3_ABI = parseAbi([
      "function aggregate3((address target, bool allowFailure, bytes callData)[] calls)",
    ]);
    const emptyInner = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      args: [[]],
    });
    const call = { target: USDC, allowFailure: false, callData: USDC_TRANSFER };
    const fullInner = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      args: [[call, call, call]],
    });
    const outer = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      args: [
        [
          { target: MULTICALL3, allowFailure: false, callData: emptyInner },
          { target: MULTICALL3, allowFailure: false, callData: fullInner },
        ],
      ],
    });

    const node = await decodeCalldata(
      { chainId: 1, calldata: outer },
      offlineResolver,
      { maxNodes: 5 },
    );
    expect(node.subcalls?.map((s) => s.subcalls?.length ?? 0)).toEqual([0, 3]);
    expect(node.subcalls?.[1].warnings).toEqual([]);
  });

  test("unused sibling shares are reclaimed so maxNodes is a total cap", async () => {
    // One flat transfer plus one two-call inner batch under maxNodes 4: the
    // whole tree is exactly four subcall nodes, so nothing may be hidden and
    // no truncation warning may appear anywhere.
    const MULTICALL3_ABI = parseAbi([
      "function aggregate3((address target, bool allowFailure, bytes callData)[] calls)",
    ]);
    const inner = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      args: [
        [
          { target: USDC, allowFailure: false, callData: USDC_TRANSFER },
          { target: USDC, allowFailure: false, callData: USDC_TRANSFER },
        ],
      ],
    });
    const outer = encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: "aggregate3",
      args: [
        [
          { target: USDC, allowFailure: false, callData: USDC_TRANSFER },
          { target: MULTICALL3, allowFailure: false, callData: inner },
        ],
      ],
    });

    const node = await decodeCalldata(
      { chainId: 1, calldata: outer },
      offlineResolver,
      { maxNodes: 4 },
    );
    expect(node.subcalls?.map((s) => s.subcalls?.length ?? 0)).toEqual([0, 2]);
    const allWarnings = [
      ...node.warnings,
      ...(node.subcalls?.flatMap((s) => s.warnings) ?? []),
    ];
    expect(allWarnings).toEqual([]);
  });

  test("the node budget caps fan-out", async () => {
    const node = await decodeCalldata(
      { chainId: 1, calldata: AGGREGATE3_BATCH, target: MULTICALL3 },
      offlineResolver,
      { maxNodes: 1 },
    );
    expect(node.subcalls).toHaveLength(1);
    expect(node.warnings).toEqual([
      expect.objectContaining({ code: "size-limit" }),
    ]);
  });

  test("renamed tuple components still unpack (positional normalization)", async () => {
    // Component names don't affect the canonical signature, so a compatible
    // ABI naming the fields destination/ok/payload still hits the detector;
    // the extractor must read by position, not by canonical field names.
    const renamedAbi = parseAbi([
      "function aggregate3((address destination, bool ok, bytes payload)[] calls)",
    ]);
    const uploaded = createUploadedAbiStore();
    uploaded.set([...renamedAbi], MULTICALL3);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures: jest.fn().mockResolvedValue([]),
      uploaded,
    });

    const node = await decodeCalldata(
      { chainId: 1, calldata: AGGREGATE3_BATCH, target: MULTICALL3 },
      resolver,
    );
    expect(node.subcalls).toHaveLength(2);
    expect(node.subcalls![0]).toMatchObject({
      target: USDC,
      functionName: "transfer",
    });
  });

  test("an unnamed-tuple ABI still unpacks (positional decoding)", async () => {
    // An uploaded ABI without component names makes viem decode each call as
    // a positional array; the extractor must not crash or emit undefined
    // calldata.
    const unnamedAbi = parseAbi([
      "function aggregate3((address,bool,bytes)[] calls)",
    ]);
    const uploaded = createUploadedAbiStore();
    uploaded.set([...unnamedAbi], MULTICALL3);
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures: jest.fn().mockResolvedValue([]),
      uploaded,
    });

    const node = await decodeCalldata(
      { chainId: 1, calldata: AGGREGATE3_BATCH, target: MULTICALL3 },
      resolver,
    );
    expect(node.abiSource).toBe("uploaded");
    expect(node.subcalls).toHaveLength(2);
    expect(node.subcalls![0]).toMatchObject({
      target: USDC,
      functionName: "transfer",
    });
  });

  test("a colliding non-wrapper resolution never enters a wrapper detector", async () => {
    // Simulate a target whose own ABI resolves the aggregate((address,bytes)[])
    // selector to an unrelated function: the detector must not run, so the
    // extractor cannot crash on an argument list with a different shape.
    const AGGREGATE_SELECTOR = AGGREGATE3_BATCH.slice(0, 10);
    const collidingFn = parseAbi(["function foo(bytes32 x)"])[0];
    const collisionResolver = async () => ({
      source: "verified" as const,
      fn: collidingFn,
      signature: "foo(bytes32)",
    });

    const node = await decodeCalldata(
      { chainId: 1, calldata: AGGREGATE3_BATCH },
      collisionResolver,
    );
    expect(AGGREGATE_SELECTOR).toBe(node.selector);
    expect(node.signature).toBe("foo(bytes32)");
    expect(node.subcalls).toBeUndefined();
    expect(node.summary).toBeNull();
  });

  test("a lazy nested decode continues from its parent depth", async () => {
    const node = await decodeCalldata(
      { chainId: 1, calldata: USDC_TRANSFER, target: USDC },
      offlineResolver,
      { startDepth: 3 },
    );
    expect(node.depth).toBe(3);
  });
});

describe("isDegradedDecode", () => {
  test("an uploaded (or verified) ABI decode is not degraded", async () => {
    const uploaded = createUploadedAbiStore();
    uploaded.set(
      [...parseAbi(["function transfer(address to, uint256 amount)"])],
      USDC,
    );
    const resolver = createAbiResolver({
      fetchVerifiedAbi: jest.fn().mockResolvedValue(null),
      fetchSignatures: jest.fn().mockResolvedValue([]),
      uploaded,
    });
    const node = await decodeCalldata(
      { chainId: 1, calldata: USDC_TRANSFER, target: USDC },
      resolver,
    );
    expect(node.abiSource).toBe("uploaded");
    expect(isDegradedDecode(node)).toBe(false);
  });

  test("a known-table decode with a target stays refresh-eligible", async () => {
    // The verified lookup may have transiently failed; the canonical shape is
    // trusted for display but must not be cached as final.
    const withTarget = await decode(USDC_TRANSFER, { target: USDC });
    expect(withTarget.abiSource).toBe("known");
    expect(isDegradedDecode(withTarget)).toBe(true);

    // Without a target no verified ABI can ever exist: the decode is final.
    const withoutTarget = await decode(USDC_TRANSFER);
    expect(isDegradedDecode(withoutTarget)).toBe(false);
  });

  test("word-guess fallback and errors are degraded", async () => {
    const guessed = await decode(`0xdeadbeef${"1".padStart(64, "0")}`);
    expect(isDegradedDecode(guessed)).toBe(true);
    const malformed = await decode("0xdeadbeef123");
    expect(isDegradedDecode(malformed)).toBe(true);
  });

  test("an empty-calldata ETH transfer is not degraded", async () => {
    const node = await decode("0x", { target: RECIPIENT, value: 1n });
    expect(isDegradedDecode(node)).toBe(false);
  });

  test("a degraded nested subcall degrades the whole tree", async () => {
    const unknownInner = `0xdeadbeef${"1".padStart(64, "0")}` as Hex;
    const node = await decode(safeExecTransaction(USDC, unknownInner));
    expect(node.functionName).toBe("execTransaction");
    expect(isDegradedDecode(node)).toBe(true);
  });
});

describe("summaries", () => {
  test("updateDelay reads the duration", async () => {
    const calldata = encodeFunctionData({
      abi: parseAbi(["function updateDelay(uint256 newDelay)"]),
      functionName: "updateDelay",
      args: [604_800n],
    });
    const node = await decode(calldata, { target: TIMELOCK });
    expect(node.summary).toBe(
      "Updates the timelock delay to 1 week = 604,800 seconds.",
    );
  });

  test("unknown functions have no sentence", async () => {
    const node = await decode(`0xdeadbeef${"1".padStart(64, "0")}`);
    expect(node.summary).toBeNull();
  });

  test("delegate names the delegatee", async () => {
    const calldata = encodeFunctionData({
      abi: parseAbi(["function delegate(address delegatee)"]),
      functionName: "delegate",
      args: [RECIPIENT],
    });
    const node = await decode(calldata);
    expect(node.summary).toBe(
      `Delegates the caller's voting power to ${RECIPIENT.slice(0, 6)}…${RECIPIENT.slice(-4)}.`,
    );
  });
});
