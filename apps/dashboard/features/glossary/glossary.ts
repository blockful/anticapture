// Types
export interface GlossaryTerm {
  title: string;
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
  matchType: "title" | "definition";
}

// Data
export const SAMPLE_GLOSSARY_DATA: GlossaryData = {
  A: [
    {
      title: "Average Turnout ",
      definition:
        "A metric that measures the average participation of delegates/voters in a decentralized organization. It can be calculated as the number of proposals divided by the number of votes obtained.",
    },
    {
      title: "Active Supply",
      definition:
        "Number of tokens in a project that are actively used in votes, DeFi, etc. It can be calculated as the current voting power of members who have voted in a defined period of time.",
    },
  ],
  B: [
    {
      title: "BPT (Balancer Pool Token)",
      definition:
        "A deposit representation in a Balancer pool. An LP at Balancer.",
    },
    {
      title: "Bribes",
      definition:
        "Bribes can be understood as a reward to encourage people to perform a behavior. In the context of DAOs, a reward to encourage holders of a governance token to vote in a proposal or in a specific choice in a proposal.",
    },
  ],
  C: [
    {
      title: "Cancel Function",
      definition:
        "A function present in governance contracts to cancel proposals submitted in a DAO, either in its proposal, delay, or execution phase. A defense mechanism, present in the Anticapture framework.",
    },
    {
      title: "Capital Raid",
      definition:
        "The most common type of attack on DAOs, where an attacker aims to capture the governance of an organization in order to steal its treasure.",
    },
    {
      title: "CEX",
      definition: "Centralized exchange, such as Binance, Coinbase, etc.",
    },
    {
      title: "Circulating Supply",
      definition:
        "Tokens of a project that can be freely traded on the secondary market, which are already in circulation.",
    },
    {
      title: "Cost of attack",
      definition:
        "Cost of attacking a DAO. To arrive at this amount, we analyzed the cost to approve a proposal, in relation to its Average Turnout and Delegated Supply.",
    },
  ],
  D: [
    {
      title: "dcf god",
      definition:
        "Leader of the RFV Raiders and responsible for attacks on DAOs.",
    },
    {
      title: "Delegated Cap",
      definition:
        "Number of tokens delegated to addresses multiplied by their market value. So, if 1000 tokens have been delegated and 1 token = U$1, the Delegated Supply is equivalent to U$1K.",
    },
    {
      title: "Delegated Supply",
      definition:
        "Number of tokens delegated to addresses. Defines the current total voting power available to be cast in proposals.",
    },
    {
      title: "Delegates",
      definition:
        "People who actively participate in the DAO and hold delegations - voting power given by wallets that hold the governance tokens (votes) in the organization.",
    },
    {
      title: "Depth Order Chart",
      definition:
        "It measures the liquidity of a token in a specific price range. It is important for measuring the ability to move the price of a currency (appreciate/devalue) and profit from attacks, as well as undermine a decentralized organization.",
    },
    {
      title: "DEX",
      definition: "Decentralized exchange, such as Uniswap and Pancake Swap.",
    },
    {
      title: "DNS Attack",
      definition:
        "DNS (Domain Name Service) is what allows people to access websites through words, without the need to use the IP of each platform. A DNS attack takes advantage of this mechanism, carrying out strategies such as hijacking, stealing and redirecting to steal people. They can be done on governance voting platforms.",
    },
  ],
  E: [
    {
      title: "Extractable Value",
      definition:
        "A metric that compares the cost of approving a proposal in a DAO in relation to its Average Turnout and Delegated Supply, in comparison to the value that can be obtained from the treasury through such a proposal. Indicates how much can be extracted from an attack on a decentralized organization.",
    },
  ],
  F: [
    {
      title: "Fully Diluted Valuation",
      definition:
        "The valuation of a token. To find its value, simply multiply Max Supply by the price of the token.",
    },
    {
      title: "Flash Loan",
      definition:
        "A loan made and paid back in a single block. A type of loan that allows people to borrow money and pay it back immediately, in order to take advantage of market inefficiencies. Commonly applied to sandwich attacks or automating DeFi operations, it can also be used to borrow governance tokens and vote on a proposal in a DAO.",
    },
    {
      title: "Funding Rate",
      definition:
        "Cost of opening a long/short on a token. The cost comes from borrowing money from the exchange in order to leverage itself in the token.",
    },
  ],
  G: [
    {
      title: "Gini Coefficient",
      definition:
        "A metric that measures the inequality of a system. In the context of DAOs, it can be applied to analyze how centralized a governance system is.",
    },
    {
      title: "Governance tokens",
      definition:
        "Tokens used to participate in the decisions of a decentralized project.",
    },
    {
      title: "Governor",
      definition:
        "Type of structure for governance contracts, present in DAOs such as Uniswap and Compound.",
    },
  ],
  H: [
    {
      title: "Humpy",
      definition:
        "A figure known for attacking DAOs such as Balancer, Aura, Compound, and Sushi.",
    },
  ],
  I: [
    {
      title: "Incident Response",
      definition:
        "Type of report done for cybersecurity attacks. In the context of DAOs, it will be used as a response to governance attacks.",
    },
  ],
  J: [],
  K: [],
  L: [
    {
      title: "L2 Beat",
      definition:
        "The company responsible for creating the security standard for second-layer blockchains in the market. Used as a reference to develop Anticapture and our framework.",
    },
    {
      title: "Lending",
      definition:
        "Projects that offer markets for users to provide liquidity for others to lend funds, putting up collateral to guarantee their loans.",
    },
    {
      title: "Leverage",
      definition:
        "A strategy where you borrow funds from a third party to increase your exposure to an asset. Exchanges/applications allow investors to leverage themselves on tokens, to bet for (long) or against (short) their performance. In the context of DAOs, it is useful for an attacker to attack a DAO and bet against its governance token, profiting from its devaluation.",
    },
    {
      title: "Liquid Treasury",
      definition:
        "The assets in the treasury that have market liquidity to be sold, not counting the organization's own governance tokens.",
    },
    {
      title: "Liquidity",
      definition:
        "The amount of money available on the market to absorb the purchase/sale of a token.",
    },
    {
      title: "Liquidity Mining",
      definition:
        "Reward/incentive programs carried out by projects, usually with governance tokens.",
    },
    {
      title: "LP",
      definition:
        "Representation of participation in the liquidity of a pool in a protocol.",
    },
  ],
  M: [
    {
      title: "Market cap",
      definition:
        "Value of all the tokens in circulation in a project. Equals the current value of the token, multiplied by the number of tokens in circulation.",
    },
    {
      title: "Max Supply",
      definition: "Maximum number of tokens that will be issued by a project.",
    },
    {
      title: "Metaprotocol",
      definition:
        "A project whose economy is built on top of another protocol, such as Convex for Curve or Aura for Balancer.",
    },
  ],
  N: [
    {
      title: "Nakamoto Coefficient",
      definition:
        "A metric that measures how decentralized a network is. Created to measure the decentralization of Bitcoin, but can also be applied in the context of DAOs.",
    },
  ],
  O: [
    {
      title: "Open Interest",
      definition:
        "The total value of open longs and shorts on a token. Measures the capital willing to bet for or against a token.",
    },
  ],
  P: [
    {
      title: "Proposal Threshold",
      definition:
        "Number of governance tokens (votes) required to submit a proposal in a DAO.",
    },
  ],
  Q: [
    {
      title: "Quorum",
      definition:
        "The number of votes needed for a proposal to be considered for approval in governance.",
    },
  ],
  R: [
    {
      title: "RFV",
      definition:
        "Risk Free Value indicates that an organization has more assets under management than the total cost of their tokens. Identified through an RFV Coefficient of 1 or higher.",
    },
    {
      title: "RFV Coefficient",
      definition:
        "RFVC, a metric that measures how much a token total supply is worth in relation to the liquid assets in the treasury of the project that issues it. Calculated as Liquid Treasury divided by Market Cap",
    },
    {
      title: "RFV Raiders",
      definition:
        "Group specializing in finding governance tokens that are underpriced in relation to the treasuries of their respective DAOs.",
    },
  ],
  S: [
    {
      title: "Security Council",
      definition:
        "A mechanism designed to protect DAOs from attacks. It brings together people with a reputation in the organization, a multisig, and the ability to cancel proposals. There are standards developed by L2 Beat and 1kx, followed by Blockful.",
    },
    {
      title: "Slow Rug",
      definition:
        "An attack in which DAO members gradually extract resources from the organization by approving proposals that are supposed to benefit the DAO, but only benefit a select group of people.",
    },
    {
      title: "Stages",
      definition:
        "Logic of security stages, created by L2 Beat, adopted by Blockful for DAOs. Certain requirements must be met in order to fall within certain security stages. The more requirements met, the higher the stage - and the security - of a project.",
    },
  ],
  T: [
    {
      title: "Temperature Check",
      definition:
        "Preliminary voting, carried out using tools such as Snapshot, to gauge community sentiment towards a proposal. It's usually a step that precedes the on-chain vote.",
    },
    {
      title: "Timelock",
      definition:
        'The waiting time for a proposal/vote to be executed. Programmed in the governance contract of a DAO. Usually exists as its own smart contract, "Timelock Contract".',
    },
    {
      title: "Treasury",
      definition:
        "Funds of a decentralized organization. It is usually made up of governance tokens and tokens such as stablecoins, ETH and BTC.",
    },
  ],
  U: [],
  V: [
    {
      title: "veNomics",
      definition:
        "A type of economy where a token only gains governance power after being locked into a contract for a set period of time. It is also common to have a system for voting on token issues, where the holders of the governance tokens define where the emissions made by the DAO will go.",
    },
    {
      title: "Voting Delay",
      definition:
        "The period between the end of the submission of the proposal and the start of the vote (Voting Period).",
    },
    {
      title: "Voting Period",
      definition:
        "The period in which DAO members have to vote on a proposal in their governance.",
    },
    {
      title: "Voting Power",
      definition:
        "Voting power of an address. This can be equivalent to the governance tokens stored by the address or the number of delegations received by the address.",
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
      const titleMatch = term.title.toLowerCase().includes(lowerQuery);
      const definitionMatch = term.definition
        .toLowerCase()
        .includes(lowerQuery);

      if (titleMatch || definitionMatch) {
        results.push({
          term,
          letter: letter as GlossaryLetter,
          matchType: titleMatch ? "title" : "definition",
        });
      }
    });
  });

  // Sort results: exact title matches first, then partial title matches, then definition matches
  return results.sort((a, b) => {
    const aExactMatch = a.term.title.toLowerCase() === lowerQuery;
    const bExactMatch = b.term.title.toLowerCase() === lowerQuery;

    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    if (a.matchType !== b.matchType) {
      return a.matchType === "title" ? -1 : 1;
    }

    return a.term.title.localeCompare(b.term.title);
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
