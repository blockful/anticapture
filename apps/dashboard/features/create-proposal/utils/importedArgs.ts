import type { AbiParameter } from "viem";

import {
  argToStorage,
  parseArrayType,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";

/*
 * Translates the args of an imported action into what the form stores.
 *
 * A document writes an argument the way JSON does: a tuple as an object keyed by
 * component name or an array in component order, an array as an array, a boolean
 * as a boolean. The form stores something narrower, every leaf a string and every
 * tuple positional, because that is what the editor edits and a saved draft holds.
 */

/** Where the problem is inside the arg: `["durations", "total"]`, `[0]`, or `[]`. */
export type ImportedArgIssue = {
  path: (string | number)[];
  message: string;
};

export type ImportedArgResult =
  | { ok: true; storage: string }
  | { ok: false; issues: ImportedArgIssue[] };

/** `JSON.parse` runs first and a double cannot hold every decimal literal, so a
 *  figure that reaches the chain has to arrive quoted. */
const UNQUOTED_NUMBER =
  "must be quoted: a JSON number can silently change the value";

type Converted = { value: ArgValue; issues: ImportedArgIssue[] };

const componentsOf = (param: AbiParameter): readonly AbiParameter[] =>
  (param as { components?: readonly AbiParameter[] }).components ?? [];

const elementParam = (param: AbiParameter, elementType: string): AbiParameter =>
  ({ ...param, type: elementType }) as AbiParameter;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** What a value is, phrased for a message. */
const describe = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (isPlainObject(value)) return "an object";
  return typeof value;
};

const ok = (value: ArgValue): Converted => ({ value, issues: [] });

/** The placeholder value is never read: a result carrying issues is discarded. */
const bad = (path: (string | number)[], message: string): Converted => ({
  value: "",
  issues: [{ path, message }],
});

const merge = (parts: Converted[]): Converted => ({
  value: parts.map((part) => part.value),
  issues: parts.flatMap((part) => part.issues),
});

/**
 * One argument, or one value nested in one, converted against its declared type.
 * Issues carry the path down to the offending leaf, so a problem three levels
 * into a tuple reports at `actions[9].args[0].durations.total`.
 */
const convertValue = (
  param: AbiParameter,
  value: unknown,
  path: (string | number)[],
): Converted => {
  const array = parseArrayType(param.type);
  if (array) {
    if (!Array.isArray(value)) {
      return bad(
        path,
        `must be an array for ${param.type}, not ${describe(value)}`,
      );
    }
    if (array.length !== null && value.length !== array.length) {
      const entries = array.length === 1 ? "entry" : "entries";
      return bad(
        path,
        `must hold exactly ${array.length} ${entries} for ${param.type}, not ${value.length}`,
      );
    }
    const child = elementParam(param, array.elementType);
    return merge(
      value.map((item, index) => convertValue(child, item, [...path, index])),
    );
  }

  if (param.type === "tuple") {
    const components = componentsOf(param);

    // Positional, which is the shape the form stores. The arity check is what
    // stops a value being dropped on the way to the encoder.
    if (Array.isArray(value)) {
      if (value.length !== components.length) {
        const fields = components.length === 1 ? "field" : "fields";
        return bad(
          path,
          `has ${components.length} ${fields} but was given ${value.length}`,
        );
      }
      return merge(
        components.map((component, index) =>
          convertValue(component, value[index], [...path, index]),
        ),
      );
    }

    // Keyed by component name, reordered here. The only reason this conversion
    // needs the ABI at all.
    if (isPlainObject(value)) {
      const declared = new Set(components.map((c) => c.name ?? ""));
      // An extra key is a value the encoder maps nothing to, so the proposal
      // would send something narrower than the document described.
      const extras = Object.keys(value)
        .filter((key) => !declared.has(key))
        .map((key) => bad([...path, key], "isn't a field of this tuple"));

      const named = components.map((component, index) => {
        const key = component.name ?? "";
        if (!key) {
          return bad(
            path,
            `declares an unnamed field at position ${index}, so it can only be given as an array in component order`,
          );
        }
        if (!(key in value)) return bad([...path, key], "Required");
        return convertValue(component, value[key], [...path, key]);
      });

      const { issues } = merge([...extras, ...named]);
      return { value: named.map((n) => n.value), issues };
    }

    return bad(
      path,
      `must be an object keyed by component name, or an array in component order, not ${describe(value)}`,
    );
  }

  // `bool` is the one scalar whose JSON form is not a string. Stored as written,
  // whitespace included, since `treeToEncodeValue` trims before reading it.
  if (param.type === "bool") {
    if (typeof value === "boolean") return ok(value ? "true" : "false");
    if (typeof value === "string" && ["true", "false"].includes(value.trim())) {
      return ok(value);
    }
    return bad(
      path,
      `must be true or false for ${param.type}, not ${describe(value)}`,
    );
  }

  if (typeof value === "string") return ok(value);
  return bad(
    path,
    typeof value === "number"
      ? UNQUOTED_NUMBER
      : `must be a quoted string for ${param.type}, not ${describe(value)}`,
  );
};

/** Converts one imported arg against its declared ABI input. */
export const convertImportedArg = (
  input: AbiParameter,
  value: unknown,
): ImportedArgResult => {
  const { value: tree, issues } = convertValue(input, value, []);
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, storage: argToStorage(input, tree) };
};

/**
 * The same conversion with no ABI to check against, for an action whose function
 * did not resolve. It is already broken and the form says so on its row, but the
 * args still have to be stored as something editable. Only a keyed tuple is
 * refused, since ordering its fields without the components would be a guess.
 */
export const convertUntypedArg = (value: unknown): ImportedArgResult => {
  const walk = (current: unknown, path: (string | number)[]): Converted => {
    if (typeof current === "string") return ok(current);
    if (typeof current === "boolean") return ok(current ? "true" : "false");
    if (Array.isArray(current)) {
      return merge(current.map((item, i) => walk(item, [...path, i])));
    }
    if (isPlainObject(current)) {
      return bad(
        path,
        "can only be ordered once the function it belongs to resolves in the abi; name the function, or give the tuple as an array in component order",
      );
    }
    return bad(
      path,
      typeof current === "number"
        ? UNQUOTED_NUMBER
        : `must be a quoted string, not ${describe(current)}`,
    );
  };

  const { value: tree, issues } = walk(value, []);
  if (issues.length > 0) return { ok: false, issues };
  // No param to consult, so mirror argToStorage: a scalar stays itself, a
  // composite becomes JSON.
  return {
    ok: true,
    storage: typeof tree === "string" ? tree : JSON.stringify(tree),
  };
};
