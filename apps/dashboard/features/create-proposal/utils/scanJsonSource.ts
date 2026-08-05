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

export type NumberSource = { line: number; literal: string };

/**
 * Every unquoted number in the document, by path, with its line and the digits as
 * written — `JSON.parse` loses both, since `1000000000000000001` arrives as `...000`
 * with no position to report. Advisory only: anything unexpected yields an empty
 * map, so a missing entry costs a nicer message rather than a wrong one.
 */
export const scanJsonNumbers = (text: string): Map<string, NumberSource> => {
  const found = new Map<string, NumberSource>();
  let i = 0;
  let line = 1;

  const fail = (): never => {
    throw new Error("unscannable");
  };
  const ws = () => {
    while (i < text.length && " \t\n\r".includes(text[i])) {
      if (text[i] === "\n") line += 1;
      i += 1;
    }
  };
  /** Consumes a JSON string, returning it decoded enough to use as a path key. */
  const str = () => {
    if (text[i] !== '"') fail();
    i += 1;
    let out = "";
    while (text[i] !== '"') {
      if (i >= text.length) fail();
      if (text[i] === "\\") {
        // Escapes never contain an unescaped quote or a raw newline, so stepping
        // over the pair is enough to keep the position and line count honest.
        out += text[i + 1] === "u" ? "" : text[i + 1];
        i += text[i + 1] === "u" ? 6 : 2;
        continue;
      }
      out += text[i];
      i += 1;
    }
    i += 1;
    return out;
  };

  const value = (path: (string | number)[]) => {
    ws();
    const char = text[i];

    if (char === "{" || char === "[") {
      const isObject = char === "{";
      const close = isObject ? "}" : "]";
      i += 1;
      ws();
      if (text[i] === close) {
        i += 1;
        return;
      }
      for (let index = 0; ; index += 1) {
        ws();
        const key = isObject ? str() : index;
        if (isObject) {
          ws();
          if (text[i] !== ":") fail();
          i += 1;
        }
        value([...path, key]);
        ws();
        const next = text[i];
        i += 1;
        if (next === close) return;
        if (next !== ",") fail();
      }
    }

    if (char === '"') {
      str();
      return;
    }

    if (char === "-" || (char >= "0" && char <= "9")) {
      const start = i;
      while (i < text.length && !",}] \t\n\r".includes(text[i])) i += 1;
      found.set(formatJsonPath(path), {
        line,
        literal: text.slice(start, i),
      });
      return;
    }

    const keyword = ["true", "false", "null"].find((word) =>
      text.startsWith(word, i),
    );
    if (keyword === undefined) throw new Error("unscannable");
    i += keyword.length;
  };

  try {
    value([]);
    ws();
    if (i !== text.length) return new Map();
    return found;
  } catch {
    return new Map();
  }
};

/**
 * The line a `JSON.parse` failure points at, when the engine says.
 *
 * V8 alone words it two ways, one with "(line 3 column 1)" and one with no
 * position at all, so both known shapes are read and anything else yields
 * nothing.
 */
export const lineFromParseError = (
  text: string,
  error: unknown,
): number | undefined => {
  const message = error instanceof Error ? error.message : "";
  const reported = /\bline (\d+)/.exec(message);
  if (reported) return Number(reported[1]);

  const position = /\bposition (\d+)/.exec(message);
  if (!position) return undefined;
  const offset = Math.min(Number(position[1]), text.length);
  return text.slice(0, offset).split("\n").length;
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
