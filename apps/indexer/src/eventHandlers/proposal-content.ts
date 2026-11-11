import { getAddress, type Address, type Hex } from "viem";

const MAX_TITLE_LENGTH = 200;

/**
 * Extracts a proposal title from a markdown description.
 *
 * Strategy:
 * 1. Normalize literal `\n` sequences to real newlines (some proposers
 *    submit descriptions with escaped newlines).
 * 2. If the first non-empty line is an H1 (`# Title`), use it.
 * 3. Otherwise, use the first non-empty line that is not a section header
 *    (H2+), truncated to MAX_TITLE_LENGTH characters.
 */
export const parseProposalTitle = (description: string): string => {
  // Normalize literal "\n" (two chars) into real newlines
  const normalized = description.replace(/\\n/g, "\n");
  const lines = normalized.split("\n");

  // Pass 1: look for an H1 among leading lines (before any content)
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^# /.test(trimmed)) {
      return trimmed.replace(/^# +/, "");
    }
    break; // stop at first non-empty, non-H1 line
  }

  // Pass 2: no H1 found — use first non-empty, non-header line
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^#{1,6}\s/.test(trimmed)) continue;
    return trimmed.length > MAX_TITLE_LENGTH
      ? trimmed.substring(0, MAX_TITLE_LENGTH) + "..."
      : trimmed;
  }

  return "";
};

export type ProposalContent = {
  title: string;
  description: string;
  targets: string[];
  values: bigint[];
  signatures: string[];
  calldatas: string[];
};

export type ProposalContentPatch = {
  description?: string;
  targets?: readonly Address[];
  values?: readonly bigint[];
  signatures?: readonly string[];
  calldatas?: readonly Hex[];
};

/**
 * Merges a proposal edit into the stored content. Fields the patch does not
 * carry stay as they are; a new description re-parses the title.
 */
export const applyProposalContentUpdate = (
  current: ProposalContent,
  patch: ProposalContentPatch,
): ProposalContent => {
  const description = patch.description ?? current.description;
  return {
    description,
    title:
      patch.description !== undefined
        ? parseProposalTitle(description)
        : current.title,
    targets: patch.targets
      ? patch.targets.map((target) => getAddress(target))
      : current.targets,
    values: patch.values ? [...patch.values] : current.values,
    signatures: patch.signatures ? [...patch.signatures] : current.signatures,
    calldatas: patch.calldatas ? [...patch.calldatas] : current.calldatas,
  };
};
