import { toFunctionSelector } from "viem";

import { getDetector } from "@/shared/services/decoder/multicall/detectors";

const AGGREGATE = "aggregate((address,bytes)[])";
const AGGREGATE3 = "aggregate3((address,bool,bytes)[])";
const TRY_AGGREGATE = "tryAggregate(bool,(address,bytes)[])";
const EXEC_TRANSACTION =
  "execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)";
const MULTI_SEND = "multiSend(bytes)";
const SCHEDULE_BATCH =
  "scheduleBatch(address[],uint256[],bytes[],bytes32,bytes32,uint256)";

const TARGET = "0x26D5EB37002152186ec86B9835ecAf32846bC0DD";
const OTHER = "0x93a8f8072337F2D1Ff2D019761cE0ABa39723d7B";

const detectorFor = (signature: string) => {
  const detector = getDetector(toFunctionSelector(signature));
  if (!detector) throw new Error(`no detector for ${signature}`);
  return detector;
};

/** Runs a detector the way decode.ts does, on already decoded arguments. */
const extract = (signature: string, args: readonly unknown[]) =>
  detectorFor(signature).extract(args);

const warningsFor = (signature: string, args: readonly unknown[]) => {
  const detector = detectorFor(signature);
  return detector.warningsFor?.(detector.extract(args), args) ?? [];
};

// viem decodes a named tuple to an object and an unnamed one to a positional
// array, and neither shape is guaranteed: the ABI that resolved the wrapper
// may be an unverified one whose colliding selector means something else.
describe("multicall extractors accept both decoded tuple shapes", () => {
  test("aggregate reads named objects and positional arrays alike", () => {
    expect(
      extract(AGGREGATE, [[{ target: TARGET, callData: "0xabcd" }]]),
    ).toEqual([{ target: TARGET, calldata: "0xabcd" }]);
    expect(extract(AGGREGATE, [[[TARGET, "0xabcd"]]])).toEqual([
      { target: TARGET, calldata: "0xabcd" },
    ]);
    // A compatible ABI may name the fields anything; position decides.
    expect(
      extract(AGGREGATE, [[{ destination: TARGET, payload: "0xabcd" }]]),
    ).toEqual([{ target: TARGET, calldata: "0xabcd" }]);
  });

  test("aggregate3 keeps allowFailure from either shape", () => {
    const fromObject = extract(AGGREGATE3, [
      [{ target: TARGET, allowFailure: true, callData: "0x" }],
    ]);
    const fromArray = extract(AGGREGATE3, [[[TARGET, true, "0x"]]]);
    for (const [call] of [fromObject, fromArray]) {
      expect(call.mayFail).toBe(true);
      expect(call.warnings).toEqual([
        expect.objectContaining({ code: "allow-failure" }),
      ]);
    }
    const [required] = extract(AGGREGATE3, [[[TARGET, false, "0x"]]]);
    expect(required.mayFail).toBeUndefined();
    expect(required.warnings).toBeUndefined();
  });
});

describe("multicall extractors skip shapes that are not calls", () => {
  test.each([
    ["a missing calls array", [undefined]],
    ["a scalar where the array belongs", ["0xdeadbeef"]],
    ["an object where the array belongs", [{ target: TARGET }]],
  ])("%s yields no subcalls", (_label, args) => {
    expect(extract(AGGREGATE, args)).toEqual([]);
    expect(extract(AGGREGATE3, args)).toEqual([]);
  });

  test("entries that are not calls are dropped, the rest survive", () => {
    const calls = extract(AGGREGATE, [
      [
        null,
        42,
        "0xdeadbeef",
        [],
        { target: "not-an-address", callData: "0x" },
        { target: TARGET, callData: "notHex" },
        { target: TARGET, callData: "0xabcd" },
      ],
    ]);
    expect(calls).toEqual([{ target: TARGET, calldata: "0xabcd" }]);
  });

  test("tryAggregate reads its calls from the second argument", () => {
    expect(extract(TRY_AGGREGATE, [false, [[TARGET, "0x01"]]])).toEqual([
      {
        target: TARGET,
        calldata: "0x01",
        mayFail: true,
        warnings: [expect.objectContaining({ code: "allow-failure" })],
      },
    ]);
    // No requireSuccess flag at all still means the batch tolerates failure.
    expect(extract(TRY_AGGREGATE, [undefined, "nonsense"])).toEqual([]);
  });
});

describe("multiSend unpacks its hand-packed records", () => {
  const record = (operation: string, to: string, wei: string, data: string) =>
    operation +
    to.slice(2).toLowerCase() +
    wei.padStart(64, "0") +
    (((data.length - 2) / 2) >>> 0).toString(16).padStart(64, "0") +
    data.slice(2);

  test("the operation byte decides how each record executes", () => {
    const packed = `0x${record("00", TARGET, "0", "0xabcd")}${record(
      "01",
      OTHER,
      "0",
      "0x",
    )}`;
    expect(extract(MULTI_SEND, [packed])).toEqual([
      { target: TARGET, value: 0n, calldata: "0xabcd" },
      {
        target: OTHER,
        value: undefined,
        calldata: "0x",
        operation: "delegatecall",
        warnings: [expect.objectContaining({ code: "delegatecall" })],
      },
    ]);
  });

  test("an operation byte MultiSend would reject stops the batch", () => {
    // MultiSend itself reverts on anything but 0 or 1, so a record carrying a
    // 7 is not a call: presenting it as one would summarize an effect that
    // could never happen.
    const packed = `0x${record("00", TARGET, "0", "0xabcd")}${record(
      "07",
      OTHER,
      "0",
      "0x",
    )}`;
    expect(extract(MULTI_SEND, [packed])).toEqual([
      { target: TARGET, value: 0n, calldata: "0xabcd" },
    ]);
    expect(warningsFor(MULTI_SEND, [packed])).toEqual([
      expect.objectContaining({
        code: "size-limit",
        message: expect.stringContaining("invalid operation byte (0x07)"),
      }),
    ]);
  });

  test("a record declaring more data than remains ends the batch", () => {
    const whole = record("00", TARGET, "0", "0xabcd");
    const clipped = record("00", OTHER, "0", "0xabcdef").slice(0, -2);
    const packed = `0x${whole}${clipped}`;
    expect(extract(MULTI_SEND, [packed])).toEqual([
      { target: TARGET, value: 0n, calldata: "0xabcd" },
    ]);
    expect(warningsFor(MULTI_SEND, [packed])).toEqual([
      expect.objectContaining({
        code: "size-limit",
        message: expect.stringContaining("declares a call longer than"),
      }),
    ]);
  });

  test("a trailing stub too short to hold a header is called out", () => {
    const packed = `0x${record("00", TARGET, "0", "0x")}0011`;
    expect(extract(MULTI_SEND, [packed])).toHaveLength(1);
    expect(warningsFor(MULTI_SEND, [packed])).toEqual([
      expect.objectContaining({
        code: "size-limit",
        message: expect.stringContaining(
          "ends with 2 bytes too few to form another call",
        ),
      }),
    ]);
  });

  test("a batch that parses whole carries no remainder warning", () => {
    const packed = `0x${record("00", TARGET, "0", "0xabcd")}`;
    expect(warningsFor(MULTI_SEND, [packed])).toEqual([]);
  });

  test.each([
    ["nothing at all", undefined],
    ["a non-hex argument", "transactions"],
    ["an empty blob", "0x"],
  ])("%s yields no subcalls", (_label, packed) => {
    expect(extract(MULTI_SEND, [packed])).toEqual([]);
  });
});

describe("single and batch extractors degrade instead of throwing", () => {
  test("a Safe call with garbage arguments keeps no target and empty calldata", () => {
    expect(extract(EXEC_TRANSACTION, ["nope", "lots", 7, 0])).toEqual([
      { target: undefined, value: undefined, calldata: "0x" },
    ]);
  });

  test("a Safe delegatecall still carries its warning", () => {
    const [call] = extract(EXEC_TRANSACTION, [TARGET, 5n, "0xabcd", 1]);
    expect(call).toMatchObject({ target: TARGET, calldata: "0xabcd" });
    // Delegatecall moves no ETH to the target, so the value is dropped.
    expect(call.value).toBeUndefined();
    expect(call.warnings).toEqual([
      expect.objectContaining({ code: "delegatecall" }),
    ]);
  });

  test("a batch zips defensively across mismatched and malformed arrays", () => {
    expect(
      extract(SCHEDULE_BATCH, [[TARGET, "nope", OTHER], [1n], ["0xabcd", 7]]),
    ).toEqual([
      { target: TARGET, value: 1n, calldata: "0xabcd" },
      { target: undefined, value: undefined, calldata: "0x" },
      { target: OTHER, value: undefined, calldata: "0x" },
    ]);
  });

  test("a batch with no arrays at all yields no subcalls", () => {
    expect(extract(SCHEDULE_BATCH, [undefined, null, 5])).toEqual([]);
  });
});
