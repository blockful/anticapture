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
      term: "Average Turnout ",
      definition:
        "A metric that measures the average participation of delegates/voters in a decentralized organization. It can be calculated as the number of proposals divided by the number of votes obtained.",
    },
    {
      term: "Active Supply",
      definition:
        "Number of tokens in a project that are actively used in votes, DeFi, etc. It can be calculated as the current voting power of members who have voted in a defined period of time.",
    },
  ],
  B: [
    {
      term: "BPT (Balancer Pool Token)",
      definition:
        "A deposit representation in a Balancer pool. An LP at Balancer.",
    },
    {
      term: "Bribes",
      definition:
        "Bribes can be understood as a reward to encourage people to perform a behavior. In the context of DAOs, a reward to encourage holders of a governance token to vote in a proposal or in a specific choice in a proposal.",
    },
  ],
  C: [
    {
      term: "Cancel Function",
      definition:
        "A function present in governance contracts to cancel proposals submitted in a DAO, either in its proposal, delay, or execution phase. A defense mechanism, present in the Anticapture framework.",
    },
    {
      term: "Capital Raid",
      definition:
        "The most common type of attack on DAOs, where an attacker aims to capture the governance of an organization in order to steal its treasure.",
    },
    {
      term: "CEX",
      definition: "Centralized exchange, such as Binance, Coinbase, etc.",
    },
    {
      term: "Circulating Supply",
      definition:
        "Tokens of a project that can be freely traded on the secondary market, which are already in circulation.",
    },
    {
      term: "Cost of attack",
      definition:
        "Cost of attacking a DAO. To arrive at this amount, we analyzed the cost to approve a proposal, in relation to its Average Turnout and Delegated Supply.",
    },
  ],
  D: [
    {
      term: "dcf god",
      definition:
        "Leader of the RFV Raiders and responsible for attacks on DAOs.",
    },
    {
      term: "Delegated Cap",
      definition:
        "Number of tokens delegated to addresses multiplied by their market value. So, if 1000 tokens have been delegated and 1 token = U$1, the Delegated Supply is equivalent to U$1K.",
    },
    {
      term: "Delegated Supply",
      definition:
        "Number of tokens delegated to addresses. Defines the current total voting power available to be cast in proposals.",
    },
    {
      term: "Delegates",
      definition:
        "People who actively participate in the DAO and hold delegations - voting power given by wallets that hold the governance tokens (votes) in the organization.",
    },
    {
      term: "Depth Order Chart (Gráfico de Profundidade)",
      definition:
        "It measures the liquidity of a token in a specific price range. It is important for measuring the ability to move the price of a currency (appreciate/devalue) and profit from attacks, as well as undermine a decentralized organization.",
    },
    {
      term: "DEX",
      definition: "Decentralized exchange, such as Uniswap and Pancake Swap.",
    },
    {
      term: "DNS Attack",
      definition:
        "DNS (Domain Name Service) is what allows people to access websites through words, without the need to use the IP of each platform. A DNS attack takes advantage of this mechanism, carrying out strategies such as hijacking, stealing and redirecting to steal people. They can be done on governance voting platforms.",
    },
  ],
  E: [
    {
      term: "Extractable Value",
      definition:
        "A metric that compares the cost of approving a proposal in a DAO in relation to its Average Turnout and Delegated Supply, in comparison to the value that can be obtained from the treasury through such a proposal. Indicates how much can be extracted from an attack on a decentralized organization.",
    },
  ],
  F: [
    {
      term: "Fully Diluted Valuation",
      definition:
        "The valuation of a token. To find its value, simply multiply Max Supply by the price of the token.",
    },
    {
      term: "Flash Loan",
      definition:
        "A loan made and paid back in a single block. A type of loan that allows people to borrow money and pay it back immediately, in order to take advantage of market inefficiencies. Commonly applied to sandwich attacks or automating DeFi operations, it can also be used to borrow governance tokens and vote on a proposal in a DAO.",
    },
    {
      term: "Funding Rate",
      definition:
        "Cost of opening a long/short on a token. The cost comes from borrowing money from the exchange in order to leverage itself in the token.",
    },
  ],
  G: [],
  H: [],
  I: [],
  J: [],
  K: [],
  L: [],
  M: [],
  N: [],
  O: [],
  P: [],
  Q: [],
  R: [],
  S: [],
  T: [],
  U: [],
  V: [],
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
