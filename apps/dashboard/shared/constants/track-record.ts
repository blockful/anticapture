import { DaoIdEnum } from "@/shared/types/daos";

const PARAGRAPH_PUBLICATION_URL = "https://paragraph.com/@blockful";

export type TrackRecordCase = {
  name: string;
  description: string;
  caseUrl: string;
  /** Set when the DAO ships an icon in the dashboard; the card falls back to an initial otherwise. */
  daoId?: DaoIdEnum;
};

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  sourceUrl: string;
};

/**
 * Case copy is final (Panel v2.1 spec); each card links out to the blog.
 * TODO(DEV-1148): point the Uniswap and Arbitrum cards at their own posts once
 * they are published, and add an Arbitrum icon when design supplies the asset.
 */
export const TRACK_RECORD_CASES: TrackRecordCase[] = [
  {
    daoId: DaoIdEnum.ENS,
    name: "ENS",
    description:
      "Mitigated a governance vulnerability that could have captured a $150M treasury: found and fixed before it could be exploited.",
    caseUrl:
      "https://paragraph.com/@blockful/a-hidden-threat-to-ens-uncovering-and-solving-a-major-governanc",
  },
  {
    daoId: DaoIdEnum.UNISWAP,
    name: "Uniswap",
    description:
      "Anticapture surfaced a low-cost capture path against a multi-billion-dollar treasury, quantified before it could be exploited.",
    caseUrl: PARAGRAPH_PUBLICATION_URL,
  },
  {
    name: "Arbitrum",
    description:
      "Acquired 14.4M votes in a live stress test, demonstrating how cheaply governance could be swayed before the DAO hardened it.",
    caseUrl: PARAGRAPH_PUBLICATION_URL,
  },
];

/**
 * Wording, handles and links come verbatim from the X mentions audit
 * (Growth doc 2ky4wrw9-39373, re-verified Aug 2026); each `sourceUrl` is the
 * tweet the quote was lifted from. Only entries the audit marks as usable
 * social proof belong here — never paraphrase a quote or add one that is not
 * on that doc.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "using the Anticapture dashboard to break down what actually matters in practice",
    author: "Ethereum Foundation",
    role: "@ethereumfndn",
    sourceUrl: "https://x.com/ethereumfndn/status/2044080364717502737",
  },
  {
    quote: "makes it so easy to see when governance changes",
    author: "Lefteris Karapetsas",
    role: "Researcher and delegate, rotki",
    sourceUrl: "https://x.com/LefterisJP/status/2070613219979174269",
  },
  {
    quote:
      "Massively impressed by the @blockful_io team's @anticapture dashboard",
    author: "@blockbanzai",
    role: "DAO delegate",
    sourceUrl: "https://x.com/blockbanzai/status/1998695381194985712",
  },
  {
    quote: "Blockful is doing the lords work keeping DAOs safe",
    author: "@CupOJoseph",
    role: "Delegate and researcher",
    sourceUrl: "https://x.com/CupOJoseph/status/2034316404988449075",
  },
  {
    quote: "@anticapture reports show ENS governance security improving",
    author: "ENS DAO",
    role: "@ENS_DAO",
    sourceUrl: "https://x.com/ENS_DAO/status/1948046880505479527",
  },
];
