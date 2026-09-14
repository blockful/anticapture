import {
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
  /** Semantics caveats that must ride on the CHILD node (e.g. delegatecall). */
  warnings?: DecodeWarning[];
};

export type MulticallDetector = {
  id:
    | "safe-exec"
    | "multicall3-aggregate"
    | "multicall3-aggregate3"
    | "multicall3-tryAggregate"
    | "timelock-schedule"
    | "timelock-scheduleBatch"
    | "timelock-execute"
    | "timelock-executeBatch"
    | "governor-relay";
  /**
   * Canonical signature of the wrapper. Callers must only run a detector when
   * the RESOLVED signature matches: a target's own ABI can resolve a colliding
   * selector to an unrelated function whose args would crash the extractor.
   */
  signature: string;
  /** Verb for the parent summary: "Executes N calls" / "Schedules N calls". */
  verb: "Executes" | "Schedules";
  extract: (args: readonly unknown[]) => ExtractedSubcall[];
  warningsFor?: (args: readonly unknown[]) => DecodeWarning[];
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

const batch = (
  targets: unknown,
  values: unknown,
  payloads: unknown,
): ExtractedSubcall[] => {
  const valueList = asList(values);
  const payloadList = asList(payloads);
  // Zip defensively: independently encoded arrays can disagree in length in
  // hand-crafted calldata, and a missing payload must degrade to an empty
  // call, never to `undefined` reaching the decoder.
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
      extract: (args) => {
        // operation 1 is a delegatecall: the code at `to` runs with the
        // Safe's own storage and balance, and NO ETH moves to the target —
        // extracting the value would let the child summarize a transfer that
        // never happens.
        if (args[3] === 1) {
          const [call] = single(args[0], undefined, args[2]);
          return [
            {
              ...call,
              warnings: [
                {
                  code: "delegatecall",
                  message:
                    "Runs as a delegatecall: this code executes with the Safe's own storage and balance; effects apply to the Safe, not to this contract.",
                },
              ],
            },
          ];
        }
        return single(args[0], args[1], args[2]);
      },
      warningsFor: (args) =>
        args[3] === 1
          ? [
              {
                code: "delegatecall",
                message:
                  "This Safe transaction is a delegatecall: the inner code runs with the Safe's own storage and balance.",
              },
            ]
          : [],
    },
  },
  {
    signature: "function aggregate((address target, bytes callData)[] calls)",
    detector: {
      id: "multicall3-aggregate",
      verb: "Executes",
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
      extract: (args) => single(args[0], args[1], args[2]),
    },
  },
  {
    signature:
      "function scheduleBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt, uint256 delay)",
    detector: {
      id: "timelock-scheduleBatch",
      verb: "Schedules",
      extract: (args) => batch(args[0], args[1], args[2]),
    },
  },
  {
    signature:
      "function execute(address target, uint256 value, bytes payload, bytes32 predecessor, bytes32 salt)",
    detector: {
      id: "timelock-execute",
      verb: "Executes",
      extract: (args) => single(args[0], args[1], args[2]),
    },
  },
  {
    signature:
      "function executeBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt)",
    detector: {
      id: "timelock-executeBatch",
      verb: "Executes",
      extract: (args) => batch(args[0], args[1], args[2]),
    },
  },
  {
    signature: "function relay(address target, uint256 value, bytes data)",
    detector: {
      id: "governor-relay",
      verb: "Executes",
      extract: (args) => single(args[0], args[1], args[2]),
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
