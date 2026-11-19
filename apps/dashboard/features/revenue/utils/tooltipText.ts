/**
 * Tooltip copy is written as plain text with two conventions:
 *
 * - a blank line starts a new paragraph;
 * - `backticks` wrap a formula, a variable or a computed value.
 *
 * Keeping it text (not JSX) lets the transforms build it and the tests read
 * it; `InfoTooltip` renders the paragraphs with space between them and the
 * backticked spans in a monospace font.
 */
export type TooltipSegment = { kind: "text" | "code"; value: string };
export type TooltipParagraph = TooltipSegment[];

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

function toSegments(paragraph: string): TooltipParagraph {
  const parts = paragraph.split("`");
  // An odd number of backticks leaves one unpaired: print it and what
  // follows as text instead of swallowing the rest of the paragraph.
  const unpaired = parts.length % 2 === 0;
  const segments: TooltipParagraph = [];
  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    const isCode = index % 2 === 1 && !(unpaired && isLast);
    const value = unpaired && isLast ? `\`${part}` : part;
    if (value === "") return;
    const previous = segments[segments.length - 1];
    if (!isCode && previous?.kind === "text") {
      previous.value += value;
      return;
    }
    segments.push({ kind: isCode ? "code" : "text", value });
  });
  return segments;
}

export function parseTooltipText(text: string): TooltipParagraph[] {
  return text
    .split(/\n\s*\n/)
    .map(collapse)
    .filter((paragraph) => paragraph !== "")
    .map(toSegments);
}

type Part = string | false | null | undefined;

/** Joins the parts that are present into paragraphs. */
export const paragraphs = (...parts: Part[]): string =>
  parts.filter((part): part is string => Boolean(part)).join("\n\n");

/** Marks a formula, a variable or a computed value for the monospace font. */
export const code = (value: string): string =>
  `\`${value.replace(/`/g, "'")}\``;
