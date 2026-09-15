import {
  getAddress,
  parseAbiItem,
  toFunctionSelector,
  toFunctionSignature,
  type AbiFunction,
  type Address,
  type Hex,
} from "viem";

import {
  isAddressValue,
  isHexValue,
  isPresent,
  isRecord,
} from "@/shared/services/decoder/guards";
import type { DecodeWarning } from "@/shared/services/decoder/types";

export type ExtractedSubcall = {
  target?: Address;
  value?: bigint;
  calldata: Hex;
  /** The batch tolerates a revert here and keeps executing the rest. */
  mayFail?: boolean;
  /** Set when the wrapper delegatecalls rather than calls this target. */
  operation?: "call" | "delegatecall";
  /** Semantics caveats that must ride on the CHILD node (e.g. delegatecall). */
  warnings?: DecodeWarning[];
};

export type MulticallDetector = {
  id:
    | "safe-exec"
    | "safe-multisend"
    | "multicall3-aggregate"
    | "multicall3-aggregate3"
    | "multicall3-tryAggregate"
    | "timelock-schedule"
    | "timelock-scheduleBatch"
    | "timelock-execute"
    | "timelock-executeBatch"
    | "governor-relay"
    | "governor-propose"
    | "governor-propose-bravo";
  /**
   * Canonical signature of the wrapper. Callers must only run a detector when
   * the RESOLVED signature matches: a target's own ABI can resolve a colliding
   * selector to an unrelated function whose args would crash the extractor.
   */
  signature: string;
  /** Verb for the parent summary: "Executes N calls" / "Schedules N calls". */
  verb: "Executes" | "Schedules" | "Submits a proposal with";
  /** What the wrapper carries, when it is not a plain "call": `7 actions`. */
  noun?: { one: string; many: string };
  /**
   * Positions of the parameters the extracted calls already spell out (the
   * `targets`/`values`/`calldatas` arrays of a batch, the `calls` tuple list
   * of a Multicall3). The card lists the calls instead of repeating three
   * parallel arrays. Scalars that carry one call (`data` of a Safe
   * transaction) are not listed here: they stay visible with a note.
   */
  unpackedParams: readonly number[];
  /**
   * Position of the single `bytes` parameter that carries the batch (`data`
   * of a Safe transaction, `transactions` of a MultiSend). It stays visible,
   * annotated with what was unpacked from it. Absent for batches whose calls
   * come from arrays.
   */
  payloadParam?: number;
  extract: (args: readonly unknown[]) => ExtractedSubcall[];
  /**
   * Caveats about the WRAPPER node itself, read off the calls it yielded. The
   * arguments come along for what the calls alone cannot say, such as how much
   * of a hand-packed blob the extractor could not read.
   */
  warningsFor?: (
    subcalls: ExtractedSubcall[],
    args: readonly unknown[],
  ) => DecodeWarning[];
};

type Call2 = { target: Address; callData: Hex };
type Call3 = { target: Address; allowFailure: boolean; callData: Hex };

/**
 * The fields of a decoded tuple in component order. viem decodes named tuples
 * to objects (insertion order follows the components) and unnamed ones to
 * positional arrays, and Solidity component names never affect the canonical
 * signature: a compatible ABI may call the fields `destination`/`payload`.
 */
const fieldsOf = (value: unknown): readonly unknown[] => {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) return Object.values(value);
  return [];
};

/** The field under its canonical name, or else the one in that position. */
const fieldAt = (value: unknown, key: string, index: number): unknown =>
  isRecord(value) && key in value ? value[key] : fieldsOf(value)[index];

// A wrapper resolved from an unverified ABI can hand an extractor any shape at
// all, so every entry is tested rather than asserted. What is not a call is
// dropped here instead of reaching the decoder as `undefined`.
const toCall2 = (value: unknown): Call2 | null => {
  const target = fieldAt(value, "target", 0);
  const callData = fieldAt(value, "callData", 1);
  if (!isAddressValue(target) || !isHexValue(callData)) return null;
  return { target, callData };
};

const toCall3 = (value: unknown): Call3 | null => {
  const target = fieldAt(value, "target", 0);
  const allowFailure = fieldAt(value, "allowFailure", 1);
  const callData = fieldAt(value, "callData", 2);
  if (!isAddressValue(target) || !isHexValue(callData)) return null;
  return { target, allowFailure: allowFailure === true, callData };
};

/** Every well-shaped call in a batch argument; the rest are skipped. */
const callsIn = <T>(
  value: unknown,
  toCall: (entry: unknown) => T | null,
): T[] => (Array.isArray(value) ? value.map(toCall).filter(isPresent) : []);

const asList = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

/**
 * A delegatecall runs the target's code in the Safe's own context. Nothing
 * happens at the target, so a child rendered like an ordinary call would
 * attribute the Safe's own state changes to a contract it never touched.
 */
const DELEGATECALL_WARNING: DecodeWarning = {
  code: "delegatecall",
  message:
    "Runs as a delegatecall: the target's code executes in the Safe's own context, so its effects apply to the Safe and not to the target contract.",
};

/** The extra fields a delegatecall child carries, or nothing. */
const delegatecallPolicy = (
  isDelegatecall: boolean,
): Partial<ExtractedSubcall> =>
  isDelegatecall
    ? { operation: "delegatecall", warnings: [DELEGATECALL_WARNING] }
    : {};

/**
 * What a MultiSend blob holds beyond the records that parsed. The unpacker
 * stops at the first record it cannot read, and silence there would leave the
 * card saying "Executes 0 calls" about a blob full of bytes. Derived from the
 * calls themselves rather than by walking the blob again: each record is its
 * header plus its data, so where the last one ended is arithmetic.
 */
const multiSendRemainder = (
  subcalls: ExtractedSubcall[],
  transactions: unknown,
): DecodeWarning[] => {
  if (!isHexValue(transactions)) return [];
  const body = transactions.slice(2);
  const consumed = subcalls.reduce(
    (sum, call) => sum + MULTISEND_HEADER_CHARS + call.calldata.length - 2,
    0,
  );
  const leftover = body.length - consumed;
  if (leftover <= 0) return [];
  const operation = body.slice(consumed, consumed + 2);
  const bytes = (leftover / 2).toLocaleString("en-US");
  if (leftover < MULTISEND_HEADER_CHARS) {
    return [
      {
        code: "size-limit",
        message: `This MultiSend batch ends with ${bytes} bytes too few to form another call; they are not decoded.`,
      },
    ];
  }
  if (operation !== CALL_OPERATION && operation !== DELEGATECALL_OPERATION) {
    return [
      {
        code: "size-limit",
        message: `This MultiSend batch stops at an invalid operation byte (0x${operation}): MultiSend accepts only call (0x00) and delegatecall (0x01), and the remaining ${bytes} bytes are not decoded.`,
      },
    ];
  }
  return [
    {
      code: "size-limit",
      message: `This MultiSend batch declares a call longer than the ${bytes} bytes that remain; the rest of the batch is not decoded.`,
    },
  ];
};

/**
 * The matching caveat on the WRAPPER, so the batch says up front that some of
 * what it carries runs in the Safe's own context. Read off the extracted
 * calls: re-unpacking a 100 KiB MultiSend blob to answer the same question
 * twice is work the card pays for on every decode.
 */
const carriesDelegatecall =
  (message: string) =>
  (subcalls: ExtractedSubcall[]): DecodeWarning[] =>
    subcalls.some((call) => call.operation === "delegatecall")
      ? [{ code: "delegatecall", message }]
      : [];

/** Multicall3 lets a batch mark a call as tolerated-failure. A child rendered
 *  like a required one would promise an effect the batch never guarantees. */
const MAY_FAIL_WARNING: DecodeWarning = {
  code: "allow-failure",
  message:
    "The batch allows this call to fail: a revert here does not revert the other calls.",
};

/** The extra fields a tolerated-failure child carries, or nothing. */
const failurePolicy = (mayFail: boolean): Partial<ExtractedSubcall> =>
  mayFail ? { mayFail: true, warnings: [MAY_FAIL_WARNING] } : {};

/**
 * Safe MultiSend packs its batch by hand instead of ABI-encoding it: the
 * records are `operation(1) || to(20) || value(32) || dataLength(32) || data`
 * concatenated with no padding. Operation 1 is a delegatecall, which the Safe
 * runs against its own storage, so the byte decides how each child reads.
 */
const MULTISEND_HEADER_CHARS = (1 + 20 + 32 + 32) * 2;
const CALL_OPERATION = "00";
const DELEGATECALL_OPERATION = "01";

const unpackMultiSend = (transactions: unknown): ExtractedSubcall[] => {
  if (!isHexValue(transactions)) return [];
  const body = transactions.slice(2);
  const calls: ExtractedSubcall[] = [];
  let cursor = 0;
  while (cursor + MULTISEND_HEADER_CHARS <= body.length) {
    const operation = body.slice(cursor, cursor + 2);
    // MultiSend itself reverts on anything but call or delegatecall, so a
    // third value means this blob is not the batch it claims to be. Reading
    // past it would present records as calls that could never execute.
    if (operation !== CALL_OPERATION && operation !== DELEGATECALL_OPERATION) {
      break;
    }
    const to = `0x${body.slice(cursor + 2, cursor + 42)}`;
    const wei = BigInt(`0x${body.slice(cursor + 42, cursor + 106)}`);
    const size =
      BigInt(`0x${body.slice(cursor + 106, cursor + MULTISEND_HEADER_CHARS)}`) *
      2n;
    cursor += MULTISEND_HEADER_CHARS;
    // The lengths are hand-written and may be anything at all; a record that
    // runs past the end of the blob is where the batch stops being readable.
    if (size > BigInt(body.length - cursor)) break;
    const data = `0x${body.slice(cursor, cursor + Number(size))}`;
    cursor += Number(size);
    const isDelegatecall = operation === DELEGATECALL_OPERATION;
    calls.push({
      // Packed bytes carry no checksum; every other extractor hands the
      // decoder a checksummed address and the UI compares them as strings.
      target: isAddressValue(to) ? getAddress(to) : undefined,
      // MultiSend forwards no ETH on a delegatecall, so claiming a value
      // there would let the child summarize a transfer that never happens.
      value: isDelegatecall ? undefined : wei,
      calldata: isHexValue(data) ? data : "0x",
      ...delegatecallPolicy(isDelegatecall),
    });
  }
  return calls;
};

const single = (
  target: unknown,
  value: unknown,
  calldata: unknown,
): ExtractedSubcall[] => [
  {
    target: isAddressValue(target) ? target : undefined,
    value: typeof value === "bigint" ? value : undefined,
    calldata: isHexValue(calldata) ? calldata : "0x",
  },
];

/**
 * A batch whose parallel arrays disagree in length cannot execute: every
 * contract that takes this shape checks the lengths and reverts. Zipping them
 * anyway invents an empty call for each missing payload, and the card then
 * summarizes a batch that would never run as though it were executable.
 */
const parallelLengthsAgree = (...lists: unknown[]): boolean => {
  const [first, ...rest] = lists.map((list) => asList(list).length);
  return rest.every((length) => length === first);
};

const WOULD_REVERT_WARNING: DecodeWarning = {
  code: "would-revert",
  message:
    "This batch's arrays have different lengths, so the call would revert; its calls are not decoded.",
};

const mismatchedBatch =
  (count: number) =>
  (_subcalls: ExtractedSubcall[], args: readonly unknown[]): DecodeWarning[] =>
    parallelLengthsAgree(...args.slice(0, count)) ? [] : [WOULD_REVERT_WARNING];

const batch = (
  targets: unknown,
  values: unknown,
  payloads: unknown,
): ExtractedSubcall[] => {
  if (!parallelLengthsAgree(targets, values, payloads)) return [];
  const valueList = asList(values);
  const payloadList = asList(payloads);
  // Read defensively even so: the lengths agreeing does not make every entry
  // the type it should be, and a malformed one must degrade to an empty call
  // rather than let `undefined` reach the decoder.
  return asList(targets).map((target, i) => {
    const value = valueList[i];
    const payload = payloadList[i];
    return {
      target: isAddressValue(target) ? target : undefined,
      value: typeof value === "bigint" ? value : undefined,
      calldata: isHexValue(payload) ? payload : "0x",
    };
  });
};

/**
 * Governor Bravo splits each action into a `signatures[i]` string and a
 * `calldatas[i]` blob of ABI-encoded arguments WITHOUT the selector; the
 * governor prepends `bytes4(keccak256(signature))` at execution. An empty
 * signature means the calldata is already complete. Reassembled here so the
 * child decodes like any other call.
 */
const bravoCalldata = (signature: unknown, payload: unknown): Hex => {
  const args = isHexValue(payload) ? payload : "0x";
  if (typeof signature !== "string" || signature === "") return args;
  // Hashed as stored, whitespace included: the governor does not trim, so a
  // padded signature selects a function that will not run, and the decode
  // must not pretend otherwise.
  try {
    return `${toFunctionSelector(signature)}${args.slice(2)}`;
  } catch {
    // Not a signature the governor could hash either: the action would
    // revert, and the raw arguments are the most honest thing to show.
    return args;
  }
};

const bravoBatch = (
  targets: unknown,
  values: unknown,
  signatures: unknown,
  payloads: unknown,
): ExtractedSubcall[] => {
  if (!parallelLengthsAgree(targets, values, signatures, payloads)) return [];
  const valueList = asList(values);
  const signatureList = asList(signatures);
  const payloadList = asList(payloads);
  return asList(targets).map((target, i) => {
    const value = valueList[i];
    return {
      target: isAddressValue(target) ? target : undefined,
      value: typeof value === "bigint" ? value : undefined,
      calldata: bravoCalldata(signatureList[i], payloadList[i]),
    };
  });
};

const ACTIONS = { one: "action", many: "actions" };

const DETECTOR_DEFINITIONS: Array<{
  signature: string;
  detector: Omit<MulticallDetector, "signature">;
}> = [
  {
    signature:
      "function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures)",
    detector: {
      id: "safe-exec",
      verb: "Executes",
      unpackedParams: [],
      payloadParam: 2,
      extract: (args) => {
        // operation 1 is a delegatecall: the code at `to` runs with the
        // Safe's own storage and balance, and NO ETH moves to the target, so
        // extracting the value would let the child summarize a transfer that
        // never happens.
        if (args[3] === 1) {
          const [call] = single(args[0], undefined, args[2]);
          return [{ ...call, ...delegatecallPolicy(true) }];
        }
        return single(args[0], args[1], args[2]);
      },
      warningsFor: carriesDelegatecall(
        "This Safe transaction is a delegatecall: the inner code runs with the Safe's own storage and balance.",
      ),
    },
  },
  {
    signature: "function multiSend(bytes transactions)",
    detector: {
      id: "safe-multisend",
      verb: "Executes",
      unpackedParams: [],
      payloadParam: 0,
      extract: (args) => unpackMultiSend(args[0]),
      warningsFor: (subcalls, args) => [
        ...carriesDelegatecall(
          "This batch contains delegatecalls: that inner code runs in the Safe's own context, so its effects apply to the Safe.",
        )(subcalls),
        ...multiSendRemainder(subcalls, args[0]),
      ],
    },
  },
  {
    signature: "function aggregate((address target, bytes callData)[] calls)",
    detector: {
      id: "multicall3-aggregate",
      verb: "Executes",
      unpackedParams: [0],
      extract: (args) =>
        callsIn(args[0], toCall2).map((call) => ({
          target: call.target,
          calldata: call.callData,
        })),
    },
  },
  {
    signature:
      "function aggregate3((address target, bool allowFailure, bytes callData)[] calls)",
    detector: {
      id: "multicall3-aggregate3",
      verb: "Executes",
      unpackedParams: [0],
      extract: (args) =>
        callsIn(args[0], toCall3).map((call) => ({
          target: call.target,
          calldata: call.callData,
          ...failurePolicy(call.allowFailure),
        })),
    },
  },
  {
    signature:
      "function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls)",
    detector: {
      id: "multicall3-tryAggregate",
      verb: "Executes",
      unpackedParams: [1],
      extract: (args) => {
        // `requireSuccess` is a property of the batch, so it applies to every
        // call in it; without it the whole list is tolerated-failure.
        const policy = failurePolicy(args[0] !== true);
        return callsIn(args[1], toCall2).map((call) => ({
          target: call.target,
          calldata: call.callData,
          ...policy,
        }));
      },
    },
  },
  {
    signature:
      "function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)",
    detector: {
      id: "timelock-schedule",
      verb: "Schedules",
      unpackedParams: [],
      payloadParam: 2,
      extract: (args) => single(args[0], args[1], args[2]),
    },
  },
  {
    signature:
      "function scheduleBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt, uint256 delay)",
    detector: {
      id: "timelock-scheduleBatch",
      verb: "Schedules",
      unpackedParams: [0, 1, 2],
      extract: (args) => batch(args[0], args[1], args[2]),
      warningsFor: mismatchedBatch(3),
    },
  },
  {
    signature:
      "function execute(address target, uint256 value, bytes payload, bytes32 predecessor, bytes32 salt)",
    detector: {
      id: "timelock-execute",
      verb: "Executes",
      unpackedParams: [],
      payloadParam: 2,
      extract: (args) => single(args[0], args[1], args[2]),
    },
  },
  {
    signature:
      "function executeBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt)",
    detector: {
      id: "timelock-executeBatch",
      verb: "Executes",
      unpackedParams: [0, 1, 2],
      extract: (args) => batch(args[0], args[1], args[2]),
      warningsFor: mismatchedBatch(3),
    },
  },
  {
    signature: "function relay(address target, uint256 value, bytes data)",
    detector: {
      id: "governor-relay",
      verb: "Executes",
      unpackedParams: [],
      payloadParam: 2,
      extract: (args) => single(args[0], args[1], args[2]),
    },
  },
  // A proposal is a batch that has not been scheduled yet: the same three
  // parallel arrays, zipped into one row per action so the card reads "7
  // actions" instead of three lists and seven separate expanders.
  {
    signature:
      "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description)",
    detector: {
      id: "governor-propose",
      verb: "Submits a proposal with",
      noun: ACTIONS,
      unpackedParams: [0, 1, 2],
      extract: (args) => batch(args[0], args[1], args[2]),
      warningsFor: mismatchedBatch(3),
    },
  },
  {
    signature:
      "function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, string description)",
    detector: {
      id: "governor-propose-bravo",
      verb: "Submits a proposal with",
      noun: ACTIONS,
      unpackedParams: [0, 1, 2, 3],
      extract: (args) => bravoBatch(args[0], args[1], args[2], args[3]),
      warningsFor: mismatchedBatch(4),
    },
  },
];

let detectorsBySelector: Map<Hex, MulticallDetector> | null = null;

export const getDetector = (selector: Hex): MulticallDetector | null => {
  if (!detectorsBySelector) {
    detectorsBySelector = new Map();
    for (const { signature, detector } of DETECTOR_DEFINITIONS) {
      const fn = parseAbiItem(signature) as AbiFunction;
      detectorsBySelector.set(toFunctionSelector(fn).toLowerCase() as Hex, {
        ...detector,
        signature: toFunctionSignature(fn),
      });
    }
  }
  return detectorsBySelector.get(selector.toLowerCase() as Hex) ?? null;
};

type UnpackedCall = {
  selector: Hex | null;
  signature?: string;
  subcalls?: unknown[];
  subcallCount?: number;
};

/** The detector that produced at least one of this call's subcalls. */
const unpackingDetector = (call: UnpackedCall): MulticallDetector | null => {
  if (call.selector === null || !call.subcalls?.length) return null;
  const detector = getDetector(call.selector);
  return detector && detector.signature === call.signature ? detector : null;
};

/**
 * Positions of the parameters a wrapper's subcall list already spells out.
 * Only when EVERY extracted call is listed: a batch whose arrays disagree
 * unpacks nothing, and one the node budget cut short lists fewer calls than
 * it carries. In both cases the arrays are the only place the reader can
 * still see what the warning is about, so they stay.
 */
export const unpackedParamIndices = (
  call: UnpackedCall,
): ReadonlySet<number> => {
  const detector = unpackingDetector(call);
  const listed = call.subcalls?.length ?? 0;
  if (!detector || listed < (call.subcallCount ?? listed)) return new Set();
  return new Set(detector.unpackedParams);
};

/**
 * Position of the `bytes` parameter the subcalls were unpacked from, for a
 * call the decoder actually unpacked; undefined when the calls came from
 * arrays or nothing was unpacked.
 */
export const unpackedPayloadIndex = (call: UnpackedCall): number | undefined =>
  unpackingDetector(call)?.payloadParam;
