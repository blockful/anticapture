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

/**
 * What a parameter is, decided once.
 *
 * Every walk over an `AbiParameter` starts with the same three-way question — is
 * it an array, a tuple, or a leaf — and each answer needs the same follow-up: the
 * element parameter for an array, the components for a tuple. Written out at each
 * call site, that preamble was copied into ten functions across four files, and
 * the copies drifted: some treated bare `tuple` as an array, some forgot that an
 * array of tuples has to carry the base tuple's components down to its elements.
 * Asking here means there is one answer.
 */
export type ParamShape =
  | { kind: "array"; element: AbiParameter; length: number | null }
  | { kind: "tuple"; components: readonly AbiParameter[] }
  | { kind: "leaf"; type: string };

export const shapeOf = (param: AbiParameter): ParamShape => {
  const array = parseArrayType(param.type);
  if (array) {
    return {
      kind: "array",
      // Keeps the base tuple's `components`, so `tuple[]` elements stay
      // describable.
      element: { ...param, type: array.elementType } as AbiParameter,
      length: array.length,
    };
  }
  if (param.type === "tuple") {
    return { kind: "tuple", components: getComponents(param) };
  }
  return { kind: "leaf", type: param.type };
};

const isComposite = (type: string): boolean =>
  parseArrayType(type) !== null || type === "tuple" || type.startsWith("tuple");

/**
 * How many entries a container must hold, or null when it is free to hold any
 * number. A dynamic array is the only unbounded one.
 */
export const expectedLength = (shape: ParamShape): number | null => {
  if (shape.kind === "tuple") return shape.components.length;
  if (shape.kind === "array") return shape.length;
  return null;
};

/**
 * The one place a container's declared size is compared with what it was given.
 *
 * Both halves matter and both were getting missed: an extra entry is dropped on
 * the way to the encoder, and a missing one used to be filled in with `""`, which
 * encodes as a real zero-length field the document never described. Either way
 * the calldata says something other than the row showing it.
 */
export const arityError = (
  param: AbiParameter,
  shape: ParamShape,
  count: number,
): string | null => {
  const expected = expectedLength(shape);
  if (expected === null || expected === count) return null;
  if (shape.kind === "tuple") {
    const fields = expected === 1 ? "field" : "fields";
    return `has ${expected} ${fields} for ${param.type} but was given ${count}`;
  }
  const entries = expected === 1 ? "entry" : "entries";
  return `must hold exactly ${expected} ${entries} for ${param.type}, not ${count}`;
};

/** Builds the empty value for a param: "" for scalars, [] for dynamic arrays,
 *  k empties for fixed arrays, one empty per component for tuples. */
export const buildEmpty = (param: AbiParameter): ArgValue => {
  const shape = shapeOf(param);
  if (shape.kind === "array") {
    if (shape.length === null) return [];
    return Array.from({ length: shape.length }, () =>
      buildEmpty(shape.element),
    );
  }
  if (shape.kind === "tuple") return shape.components.map(buildEmpty);
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
  const shape = shapeOf(param);

  if (shape.kind !== "leaf") {
    if (!Array.isArray(value)) {
      throw new Error(
        `${subject} must be a JSON array for ${param.type}, got ${describeLeaf(value)}.`,
      );
    }
    // Shared with the form's validator and the JSON import, so a tuple filled
    // with the wrong number of fields is refused in the same words wherever it
    // is noticed.
    const arity = arityError(param, shape, value.length);
    if (arity) throw new Error(`${subject} ${arity}.`);

    if (shape.kind === "array") {
      return value.map((item) => coerceStrict(shape.element, item, subject));
    }
    return shape.components.map((component, i) =>
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
  const shape = shapeOf(param);
  if (shape.kind === "array") {
    return (Array.isArray(value) ? value : []).map((v) =>
      treeToEncodeValue(shape.element, v),
    );
  }
  if (shape.kind === "tuple") {
    const items = Array.isArray(value) ? value : [];
    return shape.components.map((c, i) => treeToEncodeValue(c, items[i] ?? ""));
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
  const shape = shapeOf(param);
  const items = Array.isArray(value) ? value : [];

  if (shape.kind === "array") {
    return Promise.all(
      items.map((v) => resolveAddressLeaves(shape.element, v, resolve)),
    );
  }

  if (shape.kind === "tuple") {
    return Promise.all(
      shape.components.map((c, i) =>
        resolveAddressLeaves(c, items[i] ?? "", resolve),
      ),
    );
  }

  if (shape.type !== "address" || typeof value !== "string") return value;
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
  const shape = shapeOf(param);
  if (shape.kind === "array") {
    return ((decoded as unknown[]) ?? []).map((d) =>
      decodedToArgValue(shape.element, d),
    );
  }
  if (shape.kind === "tuple") {
    if (Array.isArray(decoded)) {
      return shape.components.map((c, i) => decodedToArgValue(c, decoded[i]));
    }
    const obj = (decoded ?? {}) as Record<string, unknown>;
    return shape.components.map((c) => decodedToArgValue(c, obj[c.name ?? ""]));
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
