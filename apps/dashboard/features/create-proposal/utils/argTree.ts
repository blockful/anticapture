import {
  decodeFunctionData,
  type AbiFunction,
  type AbiParameter,
  type Hex,
} from "viem";

/**
 * Editable value tree for a function argument. A scalar (uint, int, address,
 * bool, bytes, string) is a plain string; an array or tuple is a list of child
 * values. This is the single representation every consumer goes through:
 * `isArgComplete` validates it, the modal edits it, and both the live preview
 * and `encodeActions` convert it for viem. It serializes back to the stored
 * `CustomAction.args` (`string[]`) format, so saved drafts keep working.
 */
export type ArgValue = string | ArgValue[];

type ArrayInfo = { elementType: string; length: number | null };

/** Parses a trailing `[]` or `[k]` off a Solidity type. Returns null for
 *  non-array types (incl. bare `tuple`). */
export const parseArrayType = (type: string): ArrayInfo | null => {
  const match = type.match(/^(.*)\[(\d*)\]$/);
  if (!match) return null;
  return { elementType: match[1], length: match[2] ? Number(match[2]) : null };
};

const getComponents = (param: AbiParameter): readonly AbiParameter[] =>
  (param as { components?: readonly AbiParameter[] }).components ?? [];

const isComposite = (type: string): boolean =>
  parseArrayType(type) !== null || type === "tuple" || type.startsWith("tuple");

/** The AbiParameter describing one element of an array param (keeps the base
 *  tuple's `components`). */
const elementParam = (param: AbiParameter, elementType: string): AbiParameter =>
  ({ ...param, type: elementType }) as AbiParameter;

/** Builds the empty value for a param: "" for scalars, [] for dynamic arrays,
 *  k empties for fixed arrays, one empty per component for tuples. */
export const buildEmpty = (param: AbiParameter): ArgValue => {
  const arr = parseArrayType(param.type);
  if (arr) {
    if (arr.length === null) return [];
    const child = elementParam(param, arr.elementType);
    return Array.from({ length: arr.length }, () => buildEmpty(child));
  }
  if (param.type === "tuple") {
    return getComponents(param).map((c) => buildEmpty(c));
  }
  return "";
};

const scalarToString = (value: unknown): string => {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return value.toString();
  return typeof value === "string" ? value : String(value);
};

/** How a rejected leaf is named in the error, without printing its contents. */
const describeLeaf = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "a list";
  return `a ${typeof value}`;
};

/**
 * Walks a parsed composite against the param that has to hold it, turning JSON
 * scalars into string leaves and refusing everything else. Stringifying blindly is
 * what has to be avoided: `String(null)` is `"null"` and `String({})` is
 * `"[object Object]"`, both of which read as filled-in to `customActionIssues`.
 * Shape is checked too, since a list where the ABI wants a value is a different call.
 */
const coerceStrict = (
  param: AbiParameter,
  value: unknown,
  subject: string,
): ArgValue => {
  const arr = parseArrayType(param.type);
  const composite = arr !== null || param.type === "tuple";

  if (composite) {
    if (!Array.isArray(value)) {
      throw new Error(
        `${subject} must be a JSON array for ${param.type}, got ${describeLeaf(value)}.`,
      );
    }
    if (arr) {
      const child = elementParam(param, arr.elementType);
      return value.map((item) => coerceStrict(child, item, subject));
    }
    // A tuple keeps its component order, and has to arrive holding exactly its
    // components. An extra entry the ABI has no component for would be dropped
    // on the way to the encoder; a missing one used to be filled in with "",
    // which encodes as a real zero-length field the stored action never
    // described. Both publish calldata that says something other than the row
    // showing it, so the count has to match rather than be made to match.
    const components = getComponents(param);
    if (value.length !== components.length) {
      throw new Error(
        `${subject} has ${value.length} entries for a ${param.type} of ${components.length}.`,
      );
    }
    return components.map((component, i) =>
      coerceStrict(component, value[i], subject),
    );
  }

  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return scalarToString(value);
  }
  throw new Error(
    `${subject} has ${describeLeaf(value)} where ${param.type} expects a value.`,
  );
};

/** Serializes a single top-level arg tree back to its stored string form:
 *  scalars stay as-is; composites become JSON. */
export const argToStorage = (param: AbiParameter, value: ArgValue): string => {
  if (!isComposite(param.type)) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  return JSON.stringify(value);
};

/**
 * Parses a stored arg string into an editable tree, refusing anything a composite
 * param can't hold: a blank, unparseable JSON, JSON that isn't an array, a tuple
 * that isn't its declared components, and a leaf whose shape contradicts the param.
 * Anything judging completeness, previewing calldata, or encoding comes through
 * here — the forgiving variant reports a malformed `uint256[]` as `[]`, which
 * encodes to valid calldata for an empty array.
 */
export const storageToArg = (param: AbiParameter, stored: string): ArgValue => {
  if (!isComposite(param.type)) return stored;

  const trimmed = (stored ?? "").trim();
  const subject = param.name ? `Argument "${param.name}"` : "Argument";
  const reject = (): never => {
    throw new Error(
      `${subject} must be a JSON array for ${param.type}, got ${trimmed || "nothing"}.`,
    );
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return reject();
  }
  // Shape and leaves both checked against the param, so the only trees that
  // come out of here are trees the ABI can hold.
  return coerceStrict(param, parsed, subject);
};

/**
 * `storageToArg` with the rejection swallowed, for rendering only: a malformed
 * composite degrades to the empty container so an editor has a tree to draw
 * mid-edit. Every bug in this file's history came from a caller reaching for this
 * to judge completeness, preview, or encode — those use `storageToArg`.
 */
export const storageToArgForDisplay = (
  param: AbiParameter,
  stored: string,
): ArgValue => {
  try {
    return storageToArg(param, stored);
  } catch {
    return buildEmpty(param);
  }
};

/** `argsToTrees` for rendering only. See `storageToArgForDisplay`. */
export const argsToTreesForDisplay = (
  inputs: readonly AbiParameter[],
  args: readonly string[],
): ArgValue[] =>
  inputs.map((input, i) => storageToArgForDisplay(input, args[i] ?? ""));

/**
 * Throws on a composite arg the stored string never described, rather than quietly
 * handing back an empty container. The count too: mapping over the ABI's inputs
 * alone reads a missing arg as `""` and drops an extra one, so `setMessage(string)`
 * with `args: []` would encode an empty string instead of failing.
 */
export const argsToTrees = (
  inputs: readonly AbiParameter[],
  args: readonly string[],
): ArgValue[] => {
  if (args.length !== inputs.length) {
    const expected = inputs.length === 1 ? "argument" : "arguments";
    throw new Error(
      `Expected ${inputs.length} ${expected}, got ${args.length}.`,
    );
  }
  return inputs.map((input, i) => storageToArg(input, args[i] ?? ""));
};

export const treesToArgs = (
  inputs: readonly AbiParameter[],
  trees: readonly ArgValue[],
): string[] =>
  inputs.map((input, i) => argToStorage(input, trees[i] ?? buildEmpty(input)));

/**
 * Coerces a value tree into the shape viem's encoders expect: tuples become
 * positional arrays, bools become real booleans, and scalars pass through as
 * strings (viem accepts decimal/hex strings for uint/int/bytes and 0x strings
 * for address). Addresses pass through verbatim: the preview only renders once
 * they are concrete, and publishing resolves them first via
 * `resolveAddressesInTrees`.
 */
export const treeToEncodeValue = (
  param: AbiParameter,
  value: ArgValue,
): unknown => {
  const arr = parseArrayType(param.type);
  if (arr) {
    const child = elementParam(param, arr.elementType);
    return (Array.isArray(value) ? value : []).map((v) =>
      treeToEncodeValue(child, v),
    );
  }
  if (param.type === "tuple") {
    const components = getComponents(param);
    const items = Array.isArray(value) ? value : [];
    return components.map((c, i) => treeToEncodeValue(c, items[i] ?? ""));
  }
  if (typeof value !== "string") return value;

  // The one place scalar text is normalized, so validation, the live preview
  // and the published calldata can't disagree about it. `validateSolidityArg`
  // trims before it checks, so " true " reads as a valid bool and " 0x…" as a
  // correctly sized bytes32; without the same trim here they reached viem with
  // the spaces and threw. `string` is the exception: its whitespace is part of
  // the value.
  const scalar = param.type === "string" ? value : value.trim();

  if (param.type === "bool") {
    if (scalar === "true") return true;
    if (scalar === "false") return false;
  }
  return scalar;
};

export const treesToEncodeValues = (
  inputs: readonly AbiParameter[],
  trees: readonly ArgValue[],
): unknown[] =>
  inputs.map((input, i) =>
    treeToEncodeValue(input, trees[i] ?? buildEmpty(input)),
  );

/**
 * Replaces every `address` leaf with the address it resolves to, leaving the tree
 * otherwise untouched. Publishing needs ENS names resolved and the preview doesn't;
 * doing it as a pass keeps that the only difference, so both run the same
 * `treesToEncodeValues` and the previewed calldata is the published calldata.
 */
export const resolveAddressLeaves = async (
  param: AbiParameter,
  value: ArgValue,
  resolve: (nameOrAddress: string) => Promise<`0x${string}`>,
): Promise<ArgValue> => {
  const arr = parseArrayType(param.type);
  if (arr) {
    const child = elementParam(param, arr.elementType);
    const items = Array.isArray(value) ? value : [];
    return Promise.all(
      items.map((v) => resolveAddressLeaves(child, v, resolve)),
    );
  }

  if (param.type === "tuple") {
    const components = getComponents(param);
    const items = Array.isArray(value) ? value : [];
    return Promise.all(
      components.map((c, i) =>
        resolveAddressLeaves(c, items[i] ?? "", resolve),
      ),
    );
  }

  if (param.type !== "address" || typeof value !== "string") return value;
  return resolve(value);
};

export const resolveAddressesInTrees = (
  inputs: readonly AbiParameter[],
  trees: readonly ArgValue[],
  resolve: (nameOrAddress: string) => Promise<`0x${string}`>,
): Promise<ArgValue[]> =>
  Promise.all(
    inputs.map((input, i) =>
      resolveAddressLeaves(input, trees[i] ?? buildEmpty(input), resolve),
    ),
  );

/** Converts a viem-decoded value into our string-leaved ArgValue, mapping
 *  decoded tuples (objects or arrays) back to positional component order. */
const decodedToArgValue = (param: AbiParameter, decoded: unknown): ArgValue => {
  const arr = parseArrayType(param.type);
  if (arr) {
    const child = elementParam(param, arr.elementType);
    return ((decoded as unknown[]) ?? []).map((d) =>
      decodedToArgValue(child, d),
    );
  }
  if (param.type === "tuple") {
    const components = getComponents(param);
    if (Array.isArray(decoded)) {
      return components.map((c, i) => decodedToArgValue(c, decoded[i]));
    }
    const obj = (decoded ?? {}) as Record<string, unknown>;
    return components.map((c) => decodedToArgValue(c, obj[c.name ?? ""]));
  }
  return scalarToString(decoded);
};

/**
 * Decodes a raw calldata blob against a function ABI into the stored
 * `CustomAction.args` (`string[]`) format. Throws if the selector/shape doesn't
 * match the function — callers surface this as a "couldn't decode" error.
 */
export const decodeCalldataToArgs = (
  fn: AbiFunction,
  calldata: Hex,
): string[] => {
  const { args } = decodeFunctionData({ abi: [fn], data: calldata });
  const values = (args ?? []) as readonly unknown[];
  return fn.inputs.map((input, i) =>
    argToStorage(input, decodedToArgValue(input, values[i])),
  );
};
