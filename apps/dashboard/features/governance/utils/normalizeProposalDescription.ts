/**
 * Display-only normalizer for proposal descriptions.
 *
 * Most DAOs return `description` as plain Markdown. Tornado Cash (TORN) instead
 * returns a stringified JSON object of shape `{ "title": "…", "description": "…" }`,
 * which would otherwise render as raw JSON. This unwraps that body so the Markdown
 * renderer receives clean text.
 *
 * Some DAOs (e.g. Compound) emit descriptions with escaped newlines (the two
 * characters "\n") instead of real line breaks, which collapses the whole body
 * into a single Markdown line. Convert those to real newlines so the Markdown
 * renderer lays the body out correctly. This mirrors the indexer's title parser.
 *
 * IMPORTANT: use only for display. Never normalize the description that feeds
 * on-chain queue/execute — that must stay byte-for-byte identical to the on-chain
 * value for proposal-hash matching.
 */
export const normalizeProposalDescription = (
  description?: string | null,
): string => {
  if (!description) return "";

  const trimmed = description.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.description === "string"
      ) {
        return parsed.description
          .replace(/\\r\\n/g, "\n")
          .replace(/\\n/g, "\n");
      }
    } catch {
      /* not JSON — fall through to raw description */
    }
  }

  return description.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
};
