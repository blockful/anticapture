import { parseTree, type Node, type ParseError } from "jsonc-parser";

/** `actions[1].args[0]`, the form zod renders issue paths in. */
export const formatJsonPath = (path: readonly (string | number)[]): string =>
  path.reduce<string>(
    (acc, segment) =>
      typeof segment === "number"
        ? `${acc}[${segment}]`
        : acc
          ? `${acc}.${segment}`
          : String(segment),
    "",
  );

/** 1-based line an offset falls on. */
const lineAt = (text: string, offset: number): number =>
  text.slice(0, Math.max(0, Math.min(offset, text.length))).split("\n").length;

export type JsonDocument = {
  /**
   * The document, with every number carried as the string that was written.
   *
   * `JSON.parse` cannot do this: it hands back a double, so
   * `1000000000000000001` arrives as `…000` and `1.000000000000000001` as plain
   * `1`, and a rounded figure is then indistinguishable from one that was always
   * round. Every figure in a proposal reaches `parseUnits` or the ABI encoder,
   * both of which take text, so text is what the document is read as. The one
   * number the form wants as a number, `decimals`, is coerced back by its schema.
   */
  value: unknown;
  /** The line the value at this path was written on. */
  lineOf: (path: readonly (string | number)[]) => number | undefined;
};

export type ParseJsonDocumentResult =
  | { ok: true; document: JsonDocument }
  | { ok: false; line: number | undefined };

/** Builds the value and the path-to-line index in one walk of the syntax tree. */
const collect = (
  node: Node,
  path: (string | number)[],
  text: string,
  lines: Map<string, number>,
): unknown => {
  lines.set(formatJsonPath(path), lineAt(text, node.offset));

  switch (node.type) {
    case "object": {
      const result: Record<string, unknown> = {};
      for (const property of node.children ?? []) {
        const [key, value] = property.children ?? [];
        if (typeof key?.value !== "string" || !value) continue;
        result[key.value] = collect(value, [...path, key.value], text, lines);
      }
      return result;
    }
    case "array":
      return (node.children ?? []).map((child, index) =>
        collect(child, [...path, index], text, lines),
      );
    // The whole point: the digits as written, not as a double.
    case "number":
      return text.slice(node.offset, node.offset + node.length);
    default:
      return node.value;
  }
};

/**
 * Parses a pasted document without rounding its numbers, and remembers where
 * every value was written so an issue can name its line.
 *
 * Strict about the two things a JSON document is not allowed to have. A pasted
 * proposal is meant to be machine-generated, so tolerating a comment or a
 * trailing comma here would accept a document other tools will reject.
 */
export const parseJsonDocument = (text: string): ParseJsonDocumentResult => {
  const errors: ParseError[] = [];
  const root = parseTree(text, errors, {
    allowTrailingComma: false,
    disallowComments: true,
  });

  if (!root || errors.length > 0) {
    const first = errors[0];
    return { ok: false, line: first ? lineAt(text, first.offset) : undefined };
  }

  const lines = new Map<string, number>();
  const value = collect(root, [], text, lines);
  return {
    ok: true,
    document: { value, lineOf: (path) => lines.get(formatJsonPath(path)) },
  };
};

/** Character range of a 1-based line, for putting the caret on it. */
export const rangeOfLine = (
  text: string,
  line: number,
): { start: number; end: number } => {
  const lines = text.split("\n");
  const index = Math.max(0, Math.min(line - 1, lines.length - 1));
  const start = lines.slice(0, index).reduce((n, l) => n + l.length + 1, 0);
  return { start, end: start + lines[index].length };
};
