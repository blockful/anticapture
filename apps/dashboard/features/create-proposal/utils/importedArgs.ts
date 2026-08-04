import type { AbiParameter } from "viem";

import {
  argToStorage,
  parseArrayType,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";

/**
 * Turns the args of an imported action into the strings the form stores.
 *
 * A document writes an argument the way JSON writes things: a tuple is an object
 * keyed by component name, or an array in component order; an array is an array;
 * a boolean is a boolean. The form stores something narrower, every leaf a
 * string, every tuple positional, every composite serialized, because that is
 * what the editor edits and what a saved draft holds.
 *
 * Translating between the two is this file's only job, and it happens once. The
 * previous arrangement validated args in one place and converted them in
 * another, which is how the two came to disagree about whether a tuple was even
 * expressible.
 */

/** Where the problem is inside the document, and what it is. */
export type ImportedArgIssue = {
  /** Relative to the arg: `["durations", "total"]`, `[0]`, or `[]`. */
  path: (string | number)[];
  message: string;
};

export type ImportedArgResult =
  | { ok: true; storage: string }
  | { ok: false; issues: ImportedArgIssue[] };

/**
 * The rule that survives from the old catch-all, narrowed to where it belongs.
 *
 * `JSON.parse` runs before any of this, and a double cannot hold every decimal
 * literal, so `1000000000000000001` arrives as `1000000000000000000` with the
 * original text already gone. A figure that reaches the chain has to arrive
 * quoted; there is no way to tell a rounded number from one that was always
 * round.
 */
const UNQUOTED_NUMBER =
  "must be quoted: a JSON number can silently change the value";

const componentsOf = (param: AbiParameter): readonly AbiParameter[] =>
  (param as { components?: readonly AbiParameter[] }).components ?? [];

const elementParam = (param: AbiParameter, elementType: string): AbiParameter =>
  ({ ...param, type: elementType }) as AbiParameter;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** What a value is, phrased for an error message. */
const describe = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (isPlainObject(value)) return "an object";
  return typeof value;
};

/**
 * One argument, or one value nested inside one, converted against its declared
 * type. Issues carry the path from the arg down to the offending leaf, so a
 * problem three levels into a tuple is reported at
 * `actions[9].args[0].durations.total` rather than at the whole argument.
 */
const convertValue = (
  param: AbiParameter,
  value: unknown,
  path: (string | number)[],
): { value: ArgValue; issues: ImportedArgIssue[] } => {
  const array = parseArrayType(param.type);
  if (array) {
    if (!Array.isArray(value)) {
      return {
        value: [],
        issues: [
          {
            path,
            message: `must be an array for ${param.type}, not ${describe(value)}`,
          },
        ],
      };
    }
    if (array.length !== null && value.length !== array.length) {
      return {
        value: [],
        issues: [
          {
            path,
            message: `must hold exactly ${array.length} ${array.length === 1 ? "entry" : "entries"} for ${param.type}, not ${value.length}`,
          },
        ],
      };
    }
    const child = elementParam(param, array.elementType);
    const converted = value.map((item, index) =>
      convertValue(child, item, [...path, index]),
    );
    return {
      value: converted.map((c) => c.value),
      issues: converted.flatMap((c) => c.issues),
    };
  }

  if (param.type === "tuple") {
    const components = componentsOf(param);

    // In component order. The form stores tuples positionally, so this is the
    // shape it wants; the arity check is what stops a value being dropped
    // silently on the way to the encoder.
    if (Array.isArray(value)) {
      if (value.length !== components.length) {
        return {
          value: [],
          issues: [
            {
              path,
              message: `has ${components.length} ${components.length === 1 ? "field" : "fields"} but was given ${value.length}`,
            },
          ],
        };
      }
      const converted = components.map((component, index) =>
        convertValue(component, value[index], [...path, index]),
      );
      return {
        value: converted.map((c) => c.value),
        issues: converted.flatMap((c) => c.issues),
      };
    }

    // Keyed by component name. Reordered into component order here, which is
    // the only reason this conversion needs the ABI at all.
    if (isPlainObject(value)) {
      const issues: ImportedArgIssue[] = [];
      const named = components.map((component, index) => {
        const key = component.name ?? "";
        if (!key) {
          issues.push({
            path,
            message: `declares an unnamed field at position ${index}, so it can only be given as an array in component order`,
          });
          return { value: "" as ArgValue, issues: [] };
        }
        if (!(key in value)) {
          issues.push({ path: [...path, key], message: "Required" });
          return { value: "" as ArgValue, issues: [] };
        }
        return convertValue(component, value[key], [...path, key]);
      });

      // An extra key is a value the encoder would drop on the floor: it maps
      // components only, so the proposal would send something narrower than the
      // document described.
      const declared = new Set(components.map((c) => c.name ?? ""));
      for (const key of Object.keys(value)) {
        if (!declared.has(key)) {
          issues.push({
            path: [...path, key],
            message: "isn't a field of this tuple",
          });
        }
      }

      return {
        value: named.map((n) => n.value),
        issues: [...issues, ...named.flatMap((n) => n.issues)],
      };
    }

    return {
      value: [],
      issues: [
        {
          path,
          message: `must be an object keyed by component name, or an array in component order, not ${describe(value)}`,
        },
      ],
    };
  }

  // Scalars from here down. `bool` is the one type whose JSON form isn't a
  // string, because a quoted boolean is indistinguishable from the strings
  // "true" and "false" that the form stores anyway.
  if (param.type === "bool") {
    if (typeof value === "boolean") {
      return { value: value ? "true" : "false", issues: [] };
    }
    // Stored exactly as written, whitespace included: `treeToEncodeValue` trims
    // a scalar before reading it, so " true " is a bool the encoder accepts, and
    // normalizing it here would be a second opinion about text that already has
    // one owner.
    if (typeof value === "string" && ["true", "false"].includes(value.trim())) {
      return { value, issues: [] };
    }
    return {
      value: "",
      issues: [
        {
          path,
          message: `must be true or false for ${param.type}, not ${describe(value)}`,
        },
      ],
    };
  }

  if (typeof value === "string") return { value, issues: [] };

  return {
    value: "",
    issues: [
      {
        path,
        message:
          typeof value === "number"
            ? UNQUOTED_NUMBER
            : `must be a quoted string for ${param.type}, not ${describe(value)}`,
      },
    ],
  };
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
 * couldn't be resolved.
 *
 * Such an action is already broken and the form says so on its row, but its args
 * still have to be stored as something, and storing them as the form's own
 * format keeps them editable once the function name is fixed. Only a keyed tuple
 * is refused: ordering its fields is impossible without the components, and
 * guessing would put values in the wrong slots.
 */
export const convertUntypedArg = (value: unknown): ImportedArgResult => {
  const walk = (
    current: unknown,
    path: (string | number)[],
  ): { value: ArgValue; issues: ImportedArgIssue[] } => {
    if (typeof current === "string") return { value: current, issues: [] };
    if (typeof current === "boolean") {
      return { value: current ? "true" : "false", issues: [] };
    }
    if (Array.isArray(current)) {
      const converted = current.map((item, index) =>
        walk(item, [...path, index]),
      );
      return {
        value: converted.map((c) => c.value),
        issues: converted.flatMap((c) => c.issues),
      };
    }
    if (isPlainObject(current)) {
      return {
        value: [],
        issues: [
          {
            path,
            message:
              "can only be ordered once the function it belongs to resolves in the abi; name the function, or give the tuple as an array in component order",
          },
        ],
      };
    }
    return {
      value: "",
      issues: [
        {
          path,
          message:
            typeof current === "number"
              ? UNQUOTED_NUMBER
              : `must be a quoted string, not ${describe(current)}`,
        },
      ],
    };
  };

  const { value: tree, issues } = walk(value, []);
  if (issues.length > 0) return { ok: false, issues };
  // No param to consult, so mirror argToStorage's rule directly: a scalar stays
  // itself, a composite becomes JSON.
  return {
    ok: true,
    storage: typeof tree === "string" ? tree : JSON.stringify(tree),
  };
};
