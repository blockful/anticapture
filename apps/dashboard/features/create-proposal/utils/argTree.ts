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

/** Recursively coerces any parsed/decoded value into a string-leaved ArgValue
 *  so the UI always edits strings, regardless of the source representation. */
const coerce = (value: unknown): ArgValue =>
  Array.isArray(value) ? value.map(coerce) : scalarToString(value);

/** Serializes a single top-level arg tree back to its stored string form:
 *  scalars stay as-is; composites become JSON. */
export const argToStorage = (param: AbiParameter, value: ArgValue): string => {
  if (!isComposite(param.type)) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  return JSON.stringify(value);
};

/**
 * Parses a stored arg string into an editable tree, refusing anything a
 * composite param can't hold: a blank, unparseable JSON, or JSON that isn't an
 * array. This is the conversion; `storageToArg` is the same one with a fallback
 * bolted on, so the two can't drift.
 *
 * Whoever is going to encode has to use this variant. `storageToArg` reports a
 * malformed `uint256[]` as `[]`, which encodes to perfectly valid calldata for
 * an empty array, so a draft that bypassed `ProposalFormSchema` would publish a
 * call that doesn't match the row describing it, with nothing to see anywhere.
 */
export const storageToArgStrict = (
  param: AbiParameter,
  stored: string,
): ArgValue => {
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
  if (!Array.isArray(parsed)) return reject();
  return coerce(parsed);
};

/** Parses a stored arg string into an editable tree. Composites are JSON; a
 *  blank or malformed composite degrades to the empty container, so the modal's
 *  live preview keeps rendering while someone is mid-edit. */
export const storageToArg = (param: AbiParameter, stored: string): ArgValue => {
  try {
    return storageToArgStrict(param, stored);
  } catch {
    return buildEmpty(param);
  }
};

export const argsToTrees = (
  inputs: readonly AbiParameter[],
  args: readonly string[],
): ArgValue[] => inputs.map((input, i) => storageToArg(input, args[i] ?? ""));

/** `argsToTrees` for the encode path: throws on a composite arg the stored
 *  string never described, rather than encoding an empty container. */
export const argsToTreesStrict = (
  inputs: readonly AbiParameter[],
  args: readonly string[],
): ArgValue[] =>
  inputs.map((input, i) => storageToArgStrict(input, args[i] ?? ""));

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
 * Replaces every `address` leaf with the address it resolves to, leaving the
 * tree otherwise untouched.
 *
 * Publishing needs ENS names turned into addresses, which the preview doesn't
 * (it only renders once the addresses are already concrete). Doing it as a pass
 * over the tree keeps that the only difference between them: both then run the
 * same `treesToEncodeValues`, so the calldata a user previews is the calldata
 * that gets published.
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
