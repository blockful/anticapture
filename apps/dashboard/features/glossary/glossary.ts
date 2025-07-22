// Types
export interface GlossaryTerm {
  term: string;
  definition: string;
}

export type GlossaryLetter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";

export type GlossaryData = Record<GlossaryLetter, GlossaryTerm[]>;

export interface GlossarySearchResult {
  term: GlossaryTerm;
  letter: GlossaryLetter;
  matchType: "term" | "definition";
}

// Data
export const SAMPLE_GLOSSARY_DATA: GlossaryData = {
  A: [
    {
      term: "Airdrop",
      definition:
        "The distribution of cryptocurrency tokens to multiple wallet addresses for free, often used as a marketing strategy or to reward community members.",
    },
    {
      term: "APY",
      definition:
        "Annual Percentage Yield - the annualized rate of return including compound interest effects.",
    },
  ],
  B: [
    {
      term: "Blockchain",
      definition:
        "A distributed ledger technology that maintains a continuously growing list of records, secured using cryptography.",
    },
  ],
  C: [
    {
      term: "DAO",
      definition:
        "Decentralized Autonomous Organization - an organization governed by smart contracts and community voting rather than traditional management structures.",
    },
  ],
  D: [
    {
      term: "Delegation",
      definition:
        "The process of assigning voting power to another address in governance systems, allowing token holders to participate indirectly in decision-making.",
    },
  ],
  E: [],
  F: [],
  G: [
    {
      term: "Governance",
      definition:
        "The process by which decisions are made in decentralized protocols, typically involving token holder voting on proposals.",
    },
  ],
  H: [],
  I: [],
  J: [],
  K: [],
  L: [],
  M: [],
  N: [],
  O: [],
  P: [
    {
      term: "Proposal",
      definition:
        "A formal suggestion for changes or actions in a DAO, submitted for community voting.",
    },
  ],
  Q: [],
  R: [],
  S: [
    {
      term: "Smart Contract",
      definition:
        "Self-executing contracts with terms directly written into code, automatically enforcing agreements without intermediaries.",
    },
  ],
  T: [
    {
      term: "Token",
      definition:
        "A digital asset that represents ownership, access rights, or voting power within a blockchain ecosystem.",
    },
  ],
  U: [],
  V: [
    {
      term: "Voting",
      definition:
        "The process of casting ballots on governance proposals, typically weighted by token holdings or delegation.",
    },
  ],
  W: [],
  X: [],
  Y: [],
  Z: [],
};

// Utilities
/**
 * Get all letters that have at least one term
 */
export function getAvailableLetters(
  glossaryData: GlossaryData,
): GlossaryLetter[] {
  return Object.entries(glossaryData)
    .filter(([, terms]) => terms.length > 0)
    .map(([letter]) => letter as GlossaryLetter);
}

/**
 * Search terms across all letters
 */
export function searchGlossary(
  glossaryData: GlossaryData,
  query: string,
): GlossarySearchResult[] {
  const results: GlossarySearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  Object.entries(glossaryData).forEach(([letter, terms]) => {
    terms.forEach((term) => {
      const termMatch = term.term.toLowerCase().includes(lowerQuery);
      const definitionMatch = term.definition
        .toLowerCase()
        .includes(lowerQuery);

      if (termMatch || definitionMatch) {
        results.push({
          term,
          letter: letter as GlossaryLetter,
          matchType: termMatch ? "term" : "definition",
        });
      }
    });
  });

  // Sort results: exact term matches first, then partial term matches, then definition matches
  return results.sort((a, b) => {
    const aExactMatch = a.term.term.toLowerCase() === lowerQuery;
    const bExactMatch = b.term.term.toLowerCase() === lowerQuery;

    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    if (a.matchType !== b.matchType) {
      return a.matchType === "term" ? -1 : 1;
    }

    return a.term.term.localeCompare(b.term.term);
  });
}

/**
 * Get all terms flattened (useful for getting total count)
 */
export function getAllTerms(glossaryData: GlossaryData): GlossaryTerm[] {
  return Object.values(glossaryData).flat();
}

/**
 * Get terms count by letter
 */
export function getTermsCountByLetter(
  glossaryData: GlossaryData,
): Record<GlossaryLetter, number> {
  const counts = {} as Record<GlossaryLetter, number>;

  Object.entries(glossaryData).forEach(([letter, terms]) => {
    counts[letter as GlossaryLetter] = terms.length;
  });

  return counts;
}
