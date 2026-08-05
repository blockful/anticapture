import {
  isHex,
  toFunctionSignature,
  type AbiFunction,
  type AbiParameter,
} from "viem";

import {
  parseArrayType,
  storageToArg,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";
import { isArgComplete } from "@/features/create-proposal/utils/validateArg";

/** Where the problem is, relative to the action, and what it is. */
export type ActionIssue = {
  path: (string | number)[];
  message: string;
};

/** The shape every entry point produces: a custom action as the form stores it. */
type CustomActionLike = {
  abi: readonly unknown[];
  functionName: string;
  args: readonly string[];
  calldata?: string;
};

/** The type left after peeling every `[]` or `[k]` off a parameter. */
const elementTypeOf = (type: string): string => {
  let current = type;
  for (
    let array = parseArrayType(current);
    array !== null;
    array = parseArrayType(current)
  ) {
    current = array.elementType;
  }
  return current;
};

const componentsOf = (param: AbiParameter): readonly AbiParameter[] =>
  (param as { components?: readonly AbiParameter[] }).components ?? [];

/**
 * Every parameter needs a string `type` all the way down: `parseArrayType`
 * calls `.match` on it, so a bare `{}` in `inputs` throws a TypeError out of the
 * argument walk below rather than being reported.
 *
 * A tuple additionally has to declare its `components`. Without them the
 * completeness walk sees a struct with no fields and calls any `[]` complete,
 * while the encoder has nothing to map the values onto.
 */
const isWellFormedParam = (param: unknown): boolean => {
  if (typeof param !== "object" || param === null) return false;
  const type = (param as { type?: unknown }).type;
  if (typeof type !== "string") return false;

  const components = (param as { components?: unknown }).components;
  if (components === undefined) return elementTypeOf(type) !== "tuple";
  return Array.isArray(components) && components.every(isWellFormedParam);
};

/**
 * An ABI array can hold a `{ "type": "function" }` with no name, or one whose
 * `inputs` are empty objects. viem's formatters and the argument walk both
 * assume the full shape and throw on the way past.
 */
const isWellFormedFunction = (item: unknown): item is AbiFunction => {
  if (typeof item !== "object" || item === null) return false;
  if ((item as { type?: unknown }).type !== "function") return false;
  if (typeof (item as { name?: unknown }).name !== "string") return false;
  const inputs = (item as { inputs?: unknown }).inputs;
  return Array.isArray(inputs) && inputs.every(isWellFormedParam);
};

/** Mirrors argTree: these args are stored as JSON, not as scalars. */
const isCompositeType = (type: string): boolean =>
  parseArrayType(type) !== null || type.startsWith("tuple");

/** Never throws: an exotic input type still reaches viem's formatter. */
export const signatureOf = (fn: AbiFunction): string | null => {
  try {
    return toFunctionSignature(fn);
  } catch {
    return null;
  }
};

/**
 * The subset of the ABI grammar viem's encoder actually implements.
 *
 * Left out on purpose: `function`, `fixed`/`ufixed` and out-of-range widths like
 * `bytes33` are legal ABI but throw in `encodeAbiParameters`, so they can only
 * fail mid-publish. Nonsense widths such as `uint257`, and a broken suffix like
 * `uint256[abc]`, are worse than a throw: viem matches them on
 * `startsWith("uint")` and quietly encodes something the declared type never
 * described.
 */
const isEncodableElementary = (type: string): boolean => {
  if (type === "address" || type === "bool" || type === "string") return true;
  if (type === "bytes") return true;

  const fixedBytes = /^bytes(\d+)$/.exec(type);
  if (fixedBytes) {
    const size = Number(fixedBytes[1]);
    return size >= 1 && size <= 32;
  }

  const integer = /^u?int(\d*)$/.exec(type);
  if (integer) {
    if (integer[1] === "") return true; // bare `int`/`uint` means 256
    const bits = Number(integer[1]);
    return bits >= 8 && bits <= 256 && bits % 8 === 0;
  }

  return false;
};

/** Recurses through tuple components; array suffixes are peeled off first. */
const isEncodableParam = (param: AbiParameter): boolean => {
  const element = elementTypeOf(param.type);
  if (element !== "tuple") return isEncodableElementary(element);
  return componentsOf(param).every(isEncodableParam);
};

/**
 * A tuple has to hold exactly its declared fields.
 *
 * `isArgComplete` walks the components, so it never looks past them, and a
 * fixed-size array gets a length check while a tuple gets none. The encoder maps
 * components only, so an extra field is dropped on the way to the calldata and
 * the proposal quietly sends something narrower than intended. Recurses so
 * tuples nested in arrays, and in other tuples, are covered too.
 */
const tupleArityError = (
  param: AbiParameter,
  value: unknown,
): string | null => {
  const array = parseArrayType(param.type);
  if (array) {
    // A non-array value here is already reported by the caller.
    if (!Array.isArray(value)) return null;
    const element = { ...param, type: array.elementType } as AbiParameter;
    for (const item of value) {
      const error = tupleArityError(element, item);
      if (error) return error;
    }
    return null;
  }

  if (param.type !== "tuple" || !Array.isArray(value)) return null;

  const components = componentsOf(param);
  if (value.length !== components.length) {
    return `has a tuple of ${components.length} field${components.length === 1 ? "" : "s"} filled with ${value.length}`;
  }

  for (const [index, component] of components.entries()) {
    const error = tupleArityError(component, value[index]);
    if (error) return error;
  }
  return null;
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
 * Resolves a `functionName` against an ABI, by full signature or by bare name.
 * Malformed entries are skipped rather than dereferenced.
 *
 * A bare name shared by several overloads is reported rather than resolved. The
 * encoder would take whichever came first in the array, and the choice is not
 * even narrowed by the arguments: the uint validator accepts 0x hex, so an
 * address-like value satisfies `foo(uint256)` exactly as well as `foo(address)`.
 * Picking one would publish that selector on nothing better than ABI ordering.
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

/**
 * Everything that has to be true for a custom action to produce the calldata it
 * claims, checked wherever an action comes from.
 *
 * The form owns this rather than the JSON import, because it is the one place
 * every action passes through: a paste, a hand-built action, and a draft loaded
 * from the API all land here. Left to the import alone, a draft could carry a
 * broken call that only surfaced when someone pressed Publish.
 */
export const customActionIssues = (action: CustomActionLike): ActionIssue[] => {
  const hasCalldata = Boolean(action.calldata?.trim());
  const hasFunctionName = action.functionName.trim().length > 0;

  if (!hasCalldata && !hasFunctionName) {
    return [{ path: ["functionName"], message: "Required" }];
  }

  /**
   * The two ways of describing a call are exclusive, and the import spec says as
   * much: "either functionName with abi and args, or raw calldata. Not both, not
   * neither".
   *
   * Accepting both would publish something other than what the form shows. The
   * encoder returns on the calldata before it looks at the ABI, while the action
   * row's subtitle is the `functionName`, so a row reading
   * `transfer(address,uint256)` could carry arbitrary bytes. Comparing the two
   * instead of refusing them would be worse: it would have to re-encode the args
   * to know they agree, and the mismatch it found would still leave no way to
   * tell which half the author meant.
   *
   * Reported on `calldata` because that is the half that silently wins. The
   * custom-action modal only ever emits one of the two, so this is reachable
   * only from a paste or an API draft.
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
      (item) =>
        typeof item === "object" &&
        item !== null &&
        (item as { type?: unknown }).type === "function" &&
        !isWellFormedFunction(item),
    )
  ) {
    return [
      {
        path: ["abi"],
        message: 'Has a "function" entry without a name or inputs',
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

  // Arrays and tuples are stored as JSON strings, and the strict check below
  // refuses every malformed one. This pass runs first only to name the two
  // failures worth naming, text that isn't a JSON array and a tuple filled with
  // the wrong number of fields, instead of the generic "is not a valid T".
  const compositeIssues = fn.inputs.flatMap<ActionIssue>((input, i) => {
    if (!isCompositeType(input.type)) return [];

    const notAnArray = {
      path: ["args", i],
      message: `Must be a JSON array for ${input.type}`,
    };

    let parsed: unknown;
    try {
      parsed = JSON.parse(action.args[i]);
    } catch {
      return [notAnArray];
    }
    if (!Array.isArray(parsed)) return [notAnArray];

    const arity = tupleArityError(input, parsed);
    return arity ? [{ path: ["args", i], message: arity }] : [];
  });
  if (compositeIssues.length > 0) return compositeIssues;

  // Validated with the converter the encoder uses, not the forgiving one.
  // `storageToArgForDisplay` hands back the empty container for a leaf the ABI
  // can't hold, such as `[{}]` for a `string[]`, and an empty dynamic array
  // reads as complete, so the action would pass here and then throw in
  // `encodeActions` on the same arg. Whatever this accepts, `argsToTrees` can
  // encode.
  return fn.inputs.flatMap<ActionIssue>((input, i) => {
    const invalid = [
      { path: ["args", i], message: `Is not a valid ${input.type}` },
    ];

    let tree: ArgValue;
    try {
      tree = storageToArg(input, action.args[i] ?? "");
    } catch {
      return invalid;
    }
    return isArgComplete(input, tree) ? [] : invalid;
  });
};
