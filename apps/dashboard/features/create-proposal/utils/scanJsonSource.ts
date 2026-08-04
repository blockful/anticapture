/**
 * Where each value in a JSON document was written, and, for numbers, exactly
 * how it was written.
 *
 * `JSON.parse` throws both away. By the time a validator sees the document,
 * `480000` and `"480000"` differ only in type, and `1000000000000000000000` has
 * already become `1e21` with its digits unrecoverable. So an error can say a
 * figure needs quoting, but it can't say *which* figure or *where*: the two
 * things that make the message actionable.
 *
 * This walks the raw text alongside the parse to recover both. It is
 * deliberately advisory: the parsed value still comes from `JSON.parse`, and
 * anything this scanner doesn't understand it reports as absent rather than
 * guessing. A missing line number costs a nicer message; a wrong one would send
 * someone to the wrong line.
 */

/** `actions[1].args[0]`, the form zod issue paths are rendered in. */
export const formatJsonPath = (path: readonly (string | number)[]): string =>
  path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${segment}]`;
    return acc ? `${acc}.${segment}` : String(segment);
  }, "");

export type JsonSourceEntry = {
  /** 1-based, so it matches what an editor's gutter shows. */
  line: number;
  /**
   * The literal as written, kept only for numbers: the one case where the
   * parsed value can no longer reproduce it.
   */
  numberLiteral?: string;
};

/** Path (in `formatJsonPath` form) to where that value sits in the text. */
export type JsonSourceMap = Map<string, JsonSourceEntry>;

const WHITESPACE = new Set([" ", "\t", "\n", "\r"]);

/**
 * A tolerant single pass over the text, recording a position per value.
 *
 * Not a validator: it assumes the text already parsed, and bails out wholesale
 * the moment it sees something it doesn't expect rather than trying to recover.
 */
class SourceScanner {
  private index = 0;
  private line = 1;
  readonly sources: JsonSourceMap = new Map();

  constructor(private readonly text: string) {}

  scan(): JsonSourceMap | null {
    try {
      this.skipWhitespace();
      this.readValue([]);
      this.skipWhitespace();
      // Trailing content means the text wasn't the single document we assumed.
      if (this.index !== this.text.length) return null;
      return this.sources;
    } catch {
      return null;
    }
  }

  private fail(): never {
    throw new Error("unscannable");
  }

  private peek(): string {
    if (this.index >= this.text.length) this.fail();
    return this.text[this.index];
  }

  private advance(): string {
    const char = this.peek();
    this.index += 1;
    if (char === "\n") this.line += 1;
    return char;
  }

  private expect(char: string): void {
    if (this.advance() !== char) this.fail();
  }

  private skipWhitespace(): void {
    while (
      this.index < this.text.length &&
      WHITESPACE.has(this.text[this.index])
    ) {
      this.advance();
    }
  }

  private record(path: readonly (string | number)[], entry: JsonSourceEntry) {
    this.sources.set(formatJsonPath(path), entry);
  }

  private readValue(path: readonly (string | number)[]): void {
    const startLine = this.line;
    const char = this.peek();

    if (char === "{") {
      this.record(path, { line: startLine });
      this.readObject(path);
      return;
    }
    if (char === "[") {
      this.record(path, { line: startLine });
      this.readArray(path);
      return;
    }
    if (char === '"') {
      this.record(path, { line: startLine });
      this.readString();
      return;
    }
    if (char === "-" || (char >= "0" && char <= "9")) {
      const literal = this.readNumberLiteral();
      this.record(path, { line: startLine, numberLiteral: literal });
      return;
    }
    // `true`, `false`, `null`: no position of their own worth recording beyond
    // where they start.
    for (const keyword of ["true", "false", "null"]) {
      if (this.text.startsWith(keyword, this.index)) {
        this.index += keyword.length;
        this.record(path, { line: startLine });
        return;
      }
    }
    this.fail();
  }

  private readObject(path: readonly (string | number)[]): void {
    this.expect("{");
    this.skipWhitespace();
    if (this.peek() === "}") {
      this.advance();
      return;
    }
    for (;;) {
      this.skipWhitespace();
      const key = this.readString();
      this.skipWhitespace();
      this.expect(":");
      this.skipWhitespace();
      this.readValue([...path, key]);
      this.skipWhitespace();
      const next = this.advance();
      if (next === "}") return;
      if (next !== ",") this.fail();
    }
  }

  private readArray(path: readonly (string | number)[]): void {
    this.expect("[");
    this.skipWhitespace();
    if (this.peek() === "]") {
      this.advance();
      return;
    }
    let index = 0;
    for (;;) {
      this.skipWhitespace();
      this.readValue([...path, index]);
      index += 1;
      this.skipWhitespace();
      const next = this.advance();
      if (next === "]") return;
      if (next !== ",") this.fail();
    }
  }

  /** Returns the decoded string, because object keys are paths. */
  private readString(): string {
    this.expect('"');
    let out = "";
    for (;;) {
      const char = this.advance();
      if (char === '"') return out;
      if (char !== "\\") {
        out += char;
        continue;
      }
      const escape = this.advance();
      switch (escape) {
        case '"':
        case "\\":
        case "/":
          out += escape;
          break;
        case "b":
          out += "\b";
          break;
        case "f":
          out += "\f";
          break;
        case "n":
          out += "\n";
          break;
        case "r":
          out += "\r";
          break;
        case "t":
          out += "\t";
          break;
        case "u": {
          const hex = this.text.slice(this.index, this.index + 4);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.fail();
          for (let i = 0; i < 4; i += 1) this.advance();
          out += String.fromCharCode(parseInt(hex, 16));
          break;
        }
        default:
          this.fail();
      }
    }
  }

  /** The literal exactly as written, which is the whole point of the exercise. */
  private readNumberLiteral(): string {
    const start = this.index;
    if (this.peek() === "-") this.advance();
    while (
      this.index < this.text.length &&
      /[0-9]/.test(this.text[this.index])
    ) {
      this.advance();
    }
    if (this.index < this.text.length && this.text[this.index] === ".") {
      this.advance();
      while (
        this.index < this.text.length &&
        /[0-9]/.test(this.text[this.index])
      ) {
        this.advance();
      }
    }
    if (this.index < this.text.length && /[eE]/.test(this.text[this.index])) {
      this.advance();
      if (this.index < this.text.length && /[+-]/.test(this.text[this.index])) {
        this.advance();
      }
      while (
        this.index < this.text.length &&
        /[0-9]/.test(this.text[this.index])
      ) {
        this.advance();
      }
    }
    const literal = this.text.slice(start, this.index);
    // A lone "-" or an empty slice means this wasn't a number after all.
    if (!/^-?\d/.test(literal)) this.fail();
    return literal;
  }
}

/**
 * Maps every value in `text` to where it was written. Returns an empty map when
 * the text can't be walked, so callers never have to distinguish "no position
 * recorded" from "scanner gave up".
 */
export const scanJsonSource = (text: string): JsonSourceMap =>
  new SourceScanner(text).scan() ?? new Map();

/**
 * The character range of a 1-based line, for putting the caret on it.
 *
 * Selecting the whole line rather than placing a bare caret means the reader sees
 * what the message is talking about without hunting along it.
 */
export const rangeOfLine = (
  text: string,
  line: number,
): { start: number; end: number } => {
  const lines = text.split("\n");
  const index = Math.max(0, Math.min(line - 1, lines.length - 1));
  let start = 0;
  for (let i = 0; i < index; i += 1) start += lines[i].length + 1;
  return { start, end: start + lines[index].length };
};

/** The 1-based line containing `offset`, for engine-reported parse positions. */
export const lineAtOffset = (text: string, offset: number): number => {
  const bounded = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  for (let i = 0; i < bounded; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
};

/**
 * The line a `JSON.parse` failure points at, when the engine says.
 *
 * There is no contract here. V8 alone words it two ways, "…in JSON at position
 * 8 (line 1 column 9)" for some failures and "Unexpected token '}', \"{…\" is
 * not valid JSON", with no offset at all, for others, and other engines differ
 * again. So both known shapes are read and anything else yields nothing, which
 * costs the message its line and no more.
 */
export const lineFromParseError = (
  text: string,
  error: unknown,
): number | undefined => {
  const message = error instanceof Error ? error.message : "";

  const reported = /\bline (\d+)/.exec(message);
  if (reported) return Number(reported[1]);

  const position = /\bposition (\d+)/.exec(message);
  if (position) return lineAtOffset(text, Number(position[1]));

  return undefined;
};
