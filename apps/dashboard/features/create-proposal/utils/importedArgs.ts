import type { AbiParameter } from "viem";

import {
  argToStorage,
  shapeOf,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";
import type { Issue } from "@/features/create-proposal/utils/issues";

export type ImportedArgIssue = Issue;

export type ImportedArgResult =
  | { ok: true; storage: string }
  | { ok: false; issues: ImportedArgIssue[] };

type Translated = { value: ArgValue; issues: ImportedArgIssue[] };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const describe = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  if (isPlainObject(value)) return "an object";
  return typeof value;
};

const ok = (value: ArgValue): Translated => ({ value, issues: [] });

const bad = (path: (string | number)[], message: string): Translated => ({
  value: "",
  issues: [{ path, message }],
});

const merge = (parts: Translated[]): Translated => ({
  value: parts.map((part) => part.value),
  issues: parts.flatMap((part) => part.issues),
});

/* Translation only: a document writes a tuple keyed by name or positionally, and
 * the form stores it positionally with every leaf a string. Whether the result is a
 * legal `uint256`, holds the right number of entries, or is filled in at all is
 * `argIssues`' answer. What stays here is what stops a value from being
 * representable at all — invisible later, because the tree could not be built. */
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
    if (Array.isArray(value)) {
      return merge(
        value.map((item, index) =>
          translate(shape.components[index] ?? param, item, [...path, index]),
        ),
      );
    }

    if (isPlainObject(value)) {
      const declared = new Set(shape.components.map((c) => c.name ?? ""));
      // An extra key is a value the encoder maps nothing to, so the proposal would
      // send something narrower than the document described. Invisible to any later
      // pass, which only sees the positional tree.
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

  // Gated on the declared type, not the value: a bare `true` given for a `string`
  // would otherwise be stored as the text "true" and pass every later check, having
  // quietly become a different value than the document wrote.
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

  if (typeof value === "string") return ok(value);

  return bad(path, `must be a value for ${param.type}, not ${describe(value)}`);
};

export const convertImportedArg = (
  input: AbiParameter,
  value: unknown,
): ImportedArgResult => {
  const { value: tree, issues } = translate(input, value, []);
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, storage: argToStorage(input, tree) };
};

/** No ABI to check against, for an action whose function did not resolve. Only a
 *  keyed tuple is refused, since ordering it without the components is a guess. */
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
  return {
    ok: true,
    storage: typeof tree === "string" ? tree : JSON.stringify(tree),
  };
};
