import { parseTree, type Node, type ParseError } from "jsonc-parser";

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

const lineAt = (text: string, offset: number): number =>
  text.slice(0, Math.max(0, Math.min(offset, text.length))).split("\n").length;

export type JsonDocument = {
  value: unknown;
  lineOf: (path: readonly (string | number)[]) => number | undefined;
};

export type ParseJsonDocumentResult =
  | { ok: true; document: JsonDocument }
  | { ok: false; line: number | undefined };

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
    // The point of this file: the digits as written. `JSON.parse` hands back a
    // double, so 1000000000000000001 arrives as …000 and every figure in a
    // proposal ends up at `parseUnits` or the ABI encoder, both of which take text.
    case "number":
      return text.slice(node.offset, node.offset + node.length);
    default:
      return node.value;
  }
};

export const parseJsonDocument = (text: string): ParseJsonDocumentResult => {
  const errors: ParseError[] = [];
  // Strict: a pasted proposal is machine-generated, so tolerating a comment or a
  // trailing comma would accept a document other tools reject.
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

export const rangeOfLine = (
  text: string,
  line: number,
): { start: number; end: number } => {
  const lines = text.split("\n");
  const index = Math.max(0, Math.min(line - 1, lines.length - 1));
  const start = lines.slice(0, index).reduce((n, l) => n + l.length + 1, 0);
  return { start, end: start + lines[index].length };
};
