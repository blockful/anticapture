/**
 * @file risk-areas.ts
 * Central location for all risk area data including titles, descriptions and requirements
 */

import { RiskAreaEnum, GovernanceImplementationEnum } from "@/lib/enums";

/**
 * Complete interface for risk area with title, description and requirements
 */
export interface RiskAreaConstants {
  title: string;
  description: string;
  requirements: GovernanceImplementationEnum[];
}

/**
 * Complete mapping of risk areas with their titles, descriptions and requirements
 */
export const RISK_AREAS: Record<RiskAreaEnum, RiskAreaConstants> = {
  [RiskAreaEnum.SPAM_VULNERABLE]: {
    title: "Spam Vulnerable",
    description:
      "Means the system can be overwhelmed by fake or low-quality proposals. This clutters governance, wastes resources, and discourages real participation.",
    requirements: [
      GovernanceImplementationEnum.SPAM_RESISTANCE,
      GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION,
      GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION,
      GovernanceImplementationEnum.PROPOSAL_THRESHOLD,
      GovernanceImplementationEnum.VOTING_PERIOD,
      GovernanceImplementationEnum.VOTING_SUBSIDY,
    ],
  },
  [RiskAreaEnum.EXTRACTABLE_VALUE]: {
    title: "Extractable Value",
    description:
      "It's the profit someone can take from a system by exploiting its design or timing. In DAOs, this might mean using voting power or insider info for personal gain.",
    requirements: [GovernanceImplementationEnum.EXTRACTABLE_VALUE],
  },
  [RiskAreaEnum.SAFEGUARDS]: {
    title: "Safeguards",
    description:
      "Protection mechanisms that prevent malicious actions or mistakes from causing harm to the DAO.",
    requirements: [
      GovernanceImplementationEnum.VETO_STRATEGY,
      GovernanceImplementationEnum.SECURITY_COUNCIL,
      GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL,
      GovernanceImplementationEnum.VOTING_SUBSIDY,
    ],
  },
  [RiskAreaEnum.HACKABLE]: {
    title: "Hackable",
    description:
      "Vulnerability to exploits that could compromise the DAO's smart contracts or governance processes.",
    requirements: [
      GovernanceImplementationEnum.AUDITED_CONTRACTS,
      GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION,
      GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION,
    ],
  },
  [RiskAreaEnum.RESPONSE_TIME]: {
    title: "Response Time",
    description:
      "How quickly the DAO can react to threats, opportunities, or governance proposals.",
    requirements: [
      GovernanceImplementationEnum.TIMELOCK_DELAY,
      GovernanceImplementationEnum.VOTING_DELAY,
      GovernanceImplementationEnum.VOTING_PERIOD,
    ],
  },
  [RiskAreaEnum.GOV_INTERFACES_VULNERABILITY]: {
    title: "Gov Interfaces Vulnerability",
    description:
      "Weaknesses in the interfaces used for governance participation that could be exploited or lead to governance failures.",
    requirements: [
      GovernanceImplementationEnum.DNS_PROTECTION,
      GovernanceImplementationEnum.VOTE_MUTABILITY,
      GovernanceImplementationEnum.VETO_STRATEGY,
    ],
  },
};
