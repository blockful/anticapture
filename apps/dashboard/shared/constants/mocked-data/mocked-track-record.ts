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
 * Case copy is final (Panel v2.1 spec). Only the ENS write-up has a published
 * URL so far.
 * TODO(DEV-1148): point the Uniswap and Arbitrum cards at their own posts once
 * they are published, and add an Arbitrum icon when design supplies the asset.
 */
export const mockedTrackRecordCases: TrackRecordCase[] = [
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
 * TODO(DEV-1148): the final testimonial set — wording, avatars, roles and tweet
 * URLs — comes from the X mentions audit (Growth doc 2ky4wrw9-39373) and needs
 * sign-off. Candidates recorded there: @LefterisJP, @blockbanzai, @CupOJoseph,
 * plus institutional pull-quotes (EF, ENS DAO, Uniswap Foundation). Only the
 * wording already verified in the audit is used here — do not ship attributed
 * quotes that have not been checked against their source.
 */
export const mockedTestimonials: Testimonial[] = [
  {
    quote: "Makes it so easy to see when governance changes.",
    author: "@LefterisJP",
    role: "Pending confirmation",
    sourceUrl: "https://x.com/LefterisJP",
  },
];
