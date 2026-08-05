import type { AbiParameter } from "viem";

import {
  argToStorage,
  shapeOf,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";
import type { Issue } from "@/features/create-proposal/utils/issues";

/*
 * Translates the args of an imported action into what the form stores.
 *
 * A document writes an argument the way JSON does: a tuple as an object keyed by
 * component name or an array in component order, an array as an array, a boolean
 * as a boolean. The form stores something narrower, every leaf a string and every
 * tuple positional, because that is what the editor edits and a saved draft holds.
 *
 * Translation only. Whether the translated value is a legal `uint256`, holds the
 * right number of entries, or is filled in at all is `argIssues`' answer, given
 * once for every action the form sees — a paste, a hand-built action, an API
 * draft. What stays here is the handful of failures that stop a value from being
 * representable at all, which no later pass could see because the tree it would
 * have inspected could not be built.
 */

/** Relative to the arg: `["durations", "total"]`, `[0]`, or `[]`. */
export type ImportedArgIssue = Issue;

export type ImportedArgResult =
  | { ok: true; storage: string }
  | { ok: false; issues: ImportedArgIssue[] };

type Translated = { value: ArgValue; issues: ImportedArgIssue[] };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** What a value is, phrased for a message. */
const describe = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (isPlainObject(value)) return "an object";
  return typeof value;
};

const ok = (value: ArgValue): Translated => ({ value, issues: [] });

/** The placeholder is never read when there are issues, and reads as missing —
 *  which `argIssues` reports as `Required` — when only a sibling failed. */
const bad = (path: (string | number)[], message: string): Translated => ({
  value: "",
  issues: [{ path, message }],
});

const merge = (parts: Translated[]): Translated => ({
  value: parts.map((part) => part.value),
  issues: parts.flatMap((part) => part.issues),
});

/**
 * One argument, or one value nested in one, rewritten in the form's shape.
 *
 * Issues carry the path down to the offending leaf, so a problem three levels
 * into a tuple reports at `actions[9].args[0].durations.total`.
 */
const translate = (
  param: AbiParameter,
  value: unknown,
  path: (string | number)[],
): Translated => {
  const shape = shapeOf(param);

  if (shape.kind === "array") {
    if (!Array.isArray(value)) {
      return bad(
        path,
        `must be an array for ${param.type}, not ${describe(value)}`,
      );
    }
    return merge(
      value.map((item, index) =>
        translate(shape.element, item, [...path, index]),
      ),
    );
  }

  if (shape.kind === "tuple") {
    // Positional, which is the shape the form stores. A count mismatch needs no
    // report here: the tree keeps whatever it was given, and `argIssues` compares
    // it with the declared components.
    if (Array.isArray(value)) {
      return merge(
        value.map((item, index) =>
          translate(shape.components[index] ?? param, item, [...path, index]),
        ),
      );
    }

    // Keyed by component name, reordered here. The only reason this translation
    // needs the ABI at all.
    if (isPlainObject(value)) {
      const declared = new Set(shape.components.map((c) => c.name ?? ""));
      // An extra key is a value the encoder maps nothing to, so the proposal
      // would send something narrower than the document described. Invisible to
      // any later pass, which only ever sees the positional tree.
      const extras = Object.keys(value)
        .filter((key) => !declared.has(key))
        .map((key) => bad([...path, key], "isn't a field of this tuple"));

      const named = shape.components.map((component, index) => {
        const key = component.name ?? "";
        if (!key) {
          return bad(
            path,
            `declares an unnamed field at position ${index}, so it can only be given as an array in component order`,
          );
        }
        // A missing key becomes an empty slot rather than an issue here:
        // `argIssues` reports it as `Required`, at the same named path, in the
        // same words a blank field in the editor gets.
        if (!(key in value)) return ok("");
        return translate(component, value[key], [...path, key]);
      });

      const { issues } = merge([...extras, ...named]);
      return { value: named.map((n) => n.value), issues };
    }

    return bad(
      path,
      `must be an object keyed by component name, or an array in component order, not ${describe(value)}`,
    );
  }

  // `bool` is the one leaf whose JSON form is not a string. Stored as written,
  // whitespace included, since `treeToEncodeValue` trims before reading it. Gated
  // on the declared type rather than on the value: a bare `true` given for a
  // `string` would otherwise be stored as the text "true" and pass every later
  // check, having quietly become a different value than the document wrote.
  if (shape.type === "bool") {
    if (typeof value === "boolean") return ok(value ? "true" : "false");
    if (typeof value === "string" && ["true", "false"].includes(value.trim())) {
      return ok(value);
    }
    return bad(
      path,
      `must be true or false for ${param.type}, not ${describe(value)}`,
    );
  }

  // Numbers included: the document is read with every figure kept as the text it
  // was written as, so nothing arrives here as a rounded double.
  if (typeof value === "string") return ok(value);

  return bad(path, `must be a value for ${param.type}, not ${describe(value)}`);
};

/** Converts one imported arg against its declared ABI input. */
export const convertImportedArg = (
  input: AbiParameter,
  value: unknown,
): ImportedArgResult => {
  const { value: tree, issues } = translate(input, value, []);
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, storage: argToStorage(input, tree) };
};

/**
 * The same translation with no ABI to check against, for an action whose function
 * did not resolve. It is already broken and the form says so on its row, but the
 * args still have to be stored as something editable. Only a keyed tuple is
 * refused, since ordering its fields without the components would be a guess.
 */
export const convertUntypedArg = (value: unknown): ImportedArgResult => {
  const walk = (current: unknown, path: (string | number)[]): Translated => {
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
    return bad(path, `must be a value, not ${describe(current)}`);
  };

  const { value: tree, issues } = walk(value, []);
  if (issues.length > 0) return { ok: false, issues };
  // No param to consult, so mirror argToStorage: a leaf stays itself, a
  // composite becomes JSON.
  return {
    ok: true,
    storage: typeof tree === "string" ? tree : JSON.stringify(tree),
  };
};
