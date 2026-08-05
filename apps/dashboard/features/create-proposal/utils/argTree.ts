import {
  decodeFunctionData,
  type AbiFunction,
  type AbiParameter,
  type Hex,
} from "viem";

export type ArgValue = string | ArgValue[];

type ArrayInfo = { elementType: string; length: number | null };

export const parseArrayType = (type: string): ArrayInfo | null => {
  const match = type.match(/^(.*)\[(\d*)\]$/);
  if (!match) return null;
  return { elementType: match[1], length: match[2] ? Number(match[2]) : null };
};

const getComponents = (param: AbiParameter): readonly AbiParameter[] =>
  (param as { components?: readonly AbiParameter[] }).components ?? [];

/** What a parameter is, decided once. Every walk over an `AbiParameter` starts
 *  with the same array/tuple/leaf question; that preamble was copied into ten
 *  functions across four files, and the copies drifted. */
export type ParamShape =
  | { kind: "array"; element: AbiParameter; length: number | null }
  | { kind: "tuple"; components: readonly AbiParameter[] }
  | { kind: "leaf"; type: string };

export const shapeOf = (param: AbiParameter): ParamShape => {
  const array = parseArrayType(param.type);
  if (array) {
    return {
      kind: "array",
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

export const expectedLength = (shape: ParamShape): number | null => {
  if (shape.kind === "tuple") return shape.components.length;
  if (shape.kind === "array") return shape.length;
  return null;
};

/** The one place a container's declared size is compared with what it holds. Both
 *  halves matter: an extra entry is dropped on the way to the encoder, and a
 *  missing one used to become "", which encodes as a real zero-length field the
 *  document never described. Either way the calldata contradicts the row. */
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

const describeLeaf = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "a list";
  return `a ${typeof value}`;
};

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

export const argToStorage = (param: AbiParameter, value: ArgValue): string => {
  if (!isComposite(param.type)) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  return JSON.stringify(value);
};

/** Strict: anything judging completeness, previewing, or encoding comes through
 *  here. The forgiving variant below reports a malformed `uint256[]` as `[]`,
 *  which encodes to valid calldata for an empty array. */
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
  return coerceStrict(param, parsed, subject);
};

/** Rendering only. Every bug in this file's history came from a caller reaching
 *  for this to judge completeness, preview, or encode. */
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

export const argsToTreesForDisplay = (
  inputs: readonly AbiParameter[],
  args: readonly string[],
): ArgValue[] =>
  inputs.map((input, i) => storageToArgForDisplay(input, args[i] ?? ""));

/** Throws rather than padding: mapping over the ABI's inputs alone reads a missing
 *  arg as "" and drops an extra one, so `setMessage(string)` with `args: []` would
 *  encode an empty string instead of failing. */
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

  // The one place scalar text is normalized, so validation, the preview and the
  // published calldata cannot disagree. `string` is the exception: its whitespace
  // is part of the value.
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

/** Done as a separate pass so previewed and published calldata run the same
 *  `treesToEncodeValues`; only ENS resolution differs between them. */
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
