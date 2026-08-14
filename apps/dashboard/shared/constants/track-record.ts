import type { ElementType } from "react";

import { ArbitrumIcon } from "@/shared/components/icons/ArbitrumIcon";
import { DaoIdEnum } from "@/shared/types/daos";

export type TrackRecordCase = {
  name: string;
  description: string;
  caseUrl: string;
  /** Set when the DAO ships an icon in the dashboard. */
  daoId?: DaoIdEnum;
  /** Avatar for cases whose subject is not a monitored DAO (no `daoConfig` entry). */
  icon?: ElementType;
};

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  sourceUrl: string;
  /** Profile picture of the account the quote is lifted from. */
  avatarSrc: string;
};

/**
 * Case copy is final (Panel v2.1 spec); each card links to the Paragraph post
 * that write-up lives in.
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
    caseUrl:
      "https://paragraph.com/@blockful/thanks-to-tallys-support-uniswap-dao-reached-stage-1-of-gov-se",
  },
  {
    icon: ArbitrumIcon,
    name: "Arbitrum",
    description:
      "Acquired 14.4M votes in a live stress test, demonstrating how cheaply governance could be swayed before the DAO hardened it.",
    caseUrl: "https://paragraph.com/@blockful/arbitrum-security-council",
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
    avatarSrc: "/images/testimonials/ethereumfndn.jpg",
  },
  {
    quote: "makes it so easy to see when governance changes",
    author: "Lefteris Karapetsas",
    role: "Researcher and delegate, rotki",
    sourceUrl: "https://x.com/LefterisJP/status/2070613219979174269",
    avatarSrc: "/images/testimonials/lefterisjp.jpg",
  },
  {
    quote:
      "Massively impressed by the @blockful_io team's @anticapture dashboard",
    author: "@blockbanzai",
    role: "DAO delegate",
    sourceUrl: "https://x.com/blockbanzai/status/1998695381194985712",
    avatarSrc: "/images/testimonials/blockbanzai.jpg",
  },
  {
    quote: "Blockful is doing the lords work keeping DAOs safe",
    author: "@CupOJoseph",
    role: "Delegate and researcher",
    sourceUrl: "https://x.com/CupOJoseph/status/2034316404988449075",
    avatarSrc: "/images/testimonials/cupojoseph.jpg",
  },
  {
    quote: "@anticapture reports show ENS governance security improving",
    author: "ENS DAO",
    role: "@ENS_DAO",
    sourceUrl: "https://x.com/ENS_DAO/status/1948046880505479527",
    avatarSrc: "/images/testimonials/ens-dao.jpg",
  },
];
