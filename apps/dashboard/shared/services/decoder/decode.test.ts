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
import { decodeCalldata } from "@/shared/services/decoder/decode";

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
    expect(node.abiSource).toBe("verified");
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

  test("a Safe delegatecall is flagged", async () => {
    const node = await decode(safeExecTransaction(USDC, USDC_TRANSFER, 1));
    expect(node.warnings).toEqual([
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

  test("a lazy nested decode continues from its parent depth", async () => {
    const node = await decodeCalldata(
      { chainId: 1, calldata: USDC_TRANSFER, target: USDC },
      offlineResolver,
      { startDepth: 3 },
    );
    expect(node.depth).toBe(3);
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
