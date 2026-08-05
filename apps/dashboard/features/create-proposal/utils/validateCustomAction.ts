import { isHex, toFunctionSignature, type AbiFunction } from "viem";

import {
  isEncodableParam,
  isWellFormedFunction,
} from "@/features/create-proposal/utils/abiSchema";
import { argIssues } from "@/features/create-proposal/utils/argIssues";
import type { Issue } from "@/features/create-proposal/utils/issues";
import {
  storageToArg,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";

/** Relative to the action: `args[0].durations.total`, `functionName`, `abi`. */
export type ActionIssue = Issue;

/** The shape every entry point produces: a custom action as the form stores it. */
type CustomActionLike = {
  abi: readonly unknown[];
  functionName: string;
  args: readonly string[];
  calldata?: string;
};

/** Never throws: an exotic input type still reaches viem's formatter. */
export const signatureOf = (fn: AbiFunction): string | null => {
  try {
    return toFunctionSignature(fn);
  } catch {
    return null;
  }
};

export type AbiFunctionLookup =
  | { kind: "found"; fn: AbiFunction }
  | { kind: "missing" }
  | { kind: "ambiguous"; signatures: string[] }
  | { kind: "readOnly"; signature: string };

/**
 * The custom-action modal keeps `view` and `pure` out of its function list, so
 * one of those could never be selected there, let alone hydrated on edit. An
 * older ABI may omit `stateMutability` entirely; that isn't a claim of
 * read-only, and the modal treats it the same way.
 */
const isStateChanging = (fn: AbiFunction): boolean =>
  fn.stateMutability !== "view" && fn.stateMutability !== "pure";

/**
 * Resolves a `functionName` against an ABI, by full signature or bare name, skipping
 * malformed entries. A bare name shared by overloads is reported, not resolved: the
 * args don't narrow the choice either, since the uint validator accepts 0x hex, so
 * an address satisfies `foo(uint256)` as well as `foo(address)`.
 */
export const findAbiFunction = (
  abi: readonly unknown[],
  functionName: string,
): AbiFunctionLookup => {
  const functions = abi.filter(isWellFormedFunction);
  const named = (item: AbiFunction) =>
    signatureOf(item) === functionName || item.name === functionName;

  const candidates = functions.filter(isStateChanging);

  const bySignature = candidates.find(
    (item) => signatureOf(item) === functionName,
  );
  if (bySignature) return { kind: "found", fn: bySignature };

  const sharingName = candidates.filter((item) => item.name === functionName);
  if (sharingName.length === 1) return { kind: "found", fn: sharingName[0] };
  if (sharingName.length > 1) {
    return {
      kind: "ambiguous",
      signatures: sharingName.map((fn) => signatureOf(fn) ?? fn.name),
    };
  }

  // Nothing selectable matched. Say which it is: "not in this abi" would be
  // wrong and confusing when the function is right there, just read-only.
  const readOnly = functions.find(named);
  if (readOnly) {
    return {
      kind: "readOnly",
      signature: signatureOf(readOnly) ?? readOnly.name,
    };
  }
  return { kind: "missing" };
};

const isFunctionEntry = (item: unknown): boolean =>
  typeof item === "object" &&
  item !== null &&
  (item as { type?: unknown }).type === "function";

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : "could not be read";

/**
 * Everything that has to be true for a custom action to produce the calldata it
 * claims. The form owns this rather than the JSON import because it is the one place
 * every action passes through — a paste, a hand-built action, and an API draft all
 * land here.
 */
export const customActionIssues = (action: CustomActionLike): ActionIssue[] => {
  const hasCalldata = Boolean(action.calldata?.trim());
  const hasFunctionName = action.functionName.trim().length > 0;

  if (!hasCalldata && !hasFunctionName) {
    return [{ path: ["functionName"], message: "Required" }];
  }

  /**
   * The two ways of describing a call are exclusive. Accepting both would publish
   * something other than what the form shows: the encoder returns on the calldata
   * before it looks at the ABI, while the row's subtitle is the `functionName`, so a
   * row reading `transfer(address,uint256)` could carry arbitrary bytes. Reported on
   * `calldata`, the half that silently wins.
   */
  if (hasCalldata && hasFunctionName) {
    return [
      {
        path: ["calldata"],
        message:
          "Can't be combined with a function name; keep either the raw calldata or the ABI call",
      },
    ];
  }

  // Checked whatever produces the calldata, because the ABI is stored either
  // way and the edit modal formats every function in it to fill its select. An
  // action that publishes fine could still take that dialog down.
  if (
    action.abi.some(
      (item) => isFunctionEntry(item) && !isWellFormedFunction(item),
    )
  ) {
    return [
      {
        path: ["abi"],
        message:
          'Has a "function" entry without a name, or with a malformed input',
      },
    ];
  }

  // Raw calldata wins in the encoder, which returns before it walks the ABI, so
  // nothing else about the ABI matters once there is calldata.
  if (hasCalldata) {
    const calldata = action.calldata!.trim();
    if (!isHex(calldata) || calldata.length % 2 !== 0) {
      return [
        {
          path: ["calldata"],
          message: "Must be 0x-prefixed hex with an even number of characters",
        },
      ];
    }
    return [];
  }

  if (action.abi.length === 0) {
    return [
      { path: ["abi"], message: "Required when a function name is used" },
    ];
  }

  const lookup = findAbiFunction(action.abi, action.functionName.trim());

  if (lookup.kind === "missing") {
    return [
      {
        path: ["functionName"],
        message: `"${action.functionName}" is not a function in this ABI`,
      },
    ];
  }
  if (lookup.kind === "readOnly") {
    return [
      {
        path: ["functionName"],
        message: `${lookup.signature} only reads state, so it can't be a proposal action`,
      },
    ];
  }
  if (lookup.kind === "ambiguous") {
    return [
      {
        path: ["functionName"],
        message: `"${action.functionName}" is overloaded here (${lookup.signatures.join(", ")}); name the one you mean in full`,
      },
    ];
  }

  const fn = lookup.fn;

  // Scoped to the selected function: only this one gets encoded, so an exotic
  // type sitting in an unrelated entry of a real contract's ABI is none of our
  // business.
  const unencodable = fn.inputs.filter((input) => !isEncodableParam(input));
  if (unencodable.length > 0) {
    return unencodable.map((input) => ({
      path: ["abi"],
      message: `Declares "${input.type}" for ${input.name || "an argument"}, which isn't an encodable ABI type`,
    }));
  }

  if (action.args.length !== fn.inputs.length) {
    return [
      {
        path: ["args"],
        message: `${signatureOf(fn) ?? fn.name} takes ${fn.inputs.length}, got ${action.args.length}`,
      },
    ];
  }

  /*
   * Read with the strict converter, then judged by `argIssues` — the same pair the
   * JSON import and the editor go through, so an action cannot be accepted in one
   * place and refused in another.
   *
   * Reported at the exact leaf, `args[0].durations.total` and not `args[0]`. What
   * to do with that precision is the caller's: the import dialog prints the path,
   * and the form, whose action rows draw no per-field errors, only counts them.
   */
  return fn.inputs.flatMap<ActionIssue>((input, i) => {
    let tree: ArgValue;
    try {
      tree = storageToArg(input, action.args[i] ?? "");
    } catch (error) {
      return [{ path: ["args", i], message: messageOf(error) }];
    }
    return argIssues(input, tree, ["args", i]);
  });
};
