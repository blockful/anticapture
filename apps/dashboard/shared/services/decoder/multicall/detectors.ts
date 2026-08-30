import {
  parseAbiItem,
  toFunctionSelector,
  toFunctionSignature,
  type AbiFunction,
  type Address,
  type Hex,
} from "viem";

import type { DecodeWarning } from "@/shared/services/decoder/types";

export type ExtractedSubcall = {
  target?: Address;
  value?: bigint;
  calldata: Hex;
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

const single = (
  target: unknown,
  value: unknown,
  calldata: unknown,
): ExtractedSubcall[] => [
  {
    target: target as Address,
    value: value as bigint,
    calldata: calldata as Hex,
  },
];

const batch = (
  targets: unknown,
  values: unknown,
  payloads: unknown,
): ExtractedSubcall[] => {
  const targetList = (targets as Address[]) ?? [];
  const valueList = (values as bigint[]) ?? [];
  const payloadList = (payloads as Hex[]) ?? [];
  // Zip defensively: independently encoded arrays can disagree in length in
  // hand-crafted calldata, and a missing payload must degrade to an empty
  // call, never to `undefined` reaching the decoder.
  return targetList.map((target, i) => ({
    target,
    value: valueList[i],
    calldata: payloadList[i] ?? "0x",
  }));
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
      extract: (args) => single(args[0], args[1], args[2]),
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
        (args[0] as Call2[]).map((call) => ({
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
        (args[0] as Call3[]).map((call) => ({
          target: call.target,
          calldata: call.callData,
        })),
    },
  },
  {
    signature:
      "function tryAggregate(bool requireSuccess, (address target, bytes callData)[] calls)",
    detector: {
      id: "multicall3-tryAggregate",
      verb: "Executes",
      extract: (args) =>
        (args[1] as Call2[]).map((call) => ({
          target: call.target,
          calldata: call.callData,
        })),
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
