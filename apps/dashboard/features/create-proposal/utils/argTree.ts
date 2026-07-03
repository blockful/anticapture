import {
  decodeFunctionData,
  type AbiFunction,
  type AbiParameter,
  type Hex,
} from "viem";

/**
 * Editable value tree for a function argument. A scalar (uint, int, address,
 * bool, bytes, string) is a plain string; an array or tuple is a list of child
 * values. This mirrors exactly the JSON shape the encoder (`encodeActions` →
 * `parseArg`) already expects, so a tree serializes back to the existing
 * `CustomAction.args` (`string[]`) format with no encoding change and full
 * backwards-compat with saved drafts.
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

/** Parses a stored arg string into an editable tree. Composites are JSON; a
 *  blank or malformed composite degrades to the empty container. */
export const storageToArg = (param: AbiParameter, stored: string): ArgValue => {
  if (!isComposite(param.type)) return stored;
  const trimmed = (stored ?? "").trim();
  if (!trimmed) return buildEmpty(param);
  try {
    return coerce(JSON.parse(trimmed));
  } catch {
    return buildEmpty(param);
  }
};

export const argsToTrees = (
  inputs: readonly AbiParameter[],
  args: readonly string[],
): ArgValue[] => inputs.map((input, i) => storageToArg(input, args[i] ?? ""));

export const treesToArgs = (
  inputs: readonly AbiParameter[],
  trees: readonly ArgValue[],
): string[] =>
  inputs.map((input, i) => argToStorage(input, trees[i] ?? buildEmpty(input)));

/**
 * Coerces a value tree into the shape viem's encoders expect: tuples become
 * positional arrays, bools become real booleans, and scalars pass through as
 * strings (viem accepts decimal/hex strings for uint/int/bytes and 0x strings
 * for address). Used for the live calldata preview — addresses are passed
 * through verbatim (no ENS resolution), so the preview only succeeds once
 * addresses are concrete.
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
  if (param.type === "bool") {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }
  return value;
};

export const treesToEncodeValues = (
  inputs: readonly AbiParameter[],
  trees: readonly ArgValue[],
): unknown[] =>
  inputs.map((input, i) =>
    treeToEncodeValue(input, trees[i] ?? buildEmpty(input)),
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
