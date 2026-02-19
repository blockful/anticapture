/**
 * @file risk-areas.ts
 * Central location for all risk area data including titles, descriptions and requirements
 */

import {
  RiskAreaEnum,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";

/**
 * Complete interface for risk area with title, description and requirements
 */
export interface RiskAreaConstants {
  title: string;
  titleAbbreviation: string;
  description: string | string[];
  requirements: GovernanceImplementationEnum[];
}

/**
 * Complete mapping of defense areas with their titles, abbreviations and requirements
 * Description field contains general defense definition (what the area protects against)
 * DAO-specific risk exposures are stored in daoConfig.attackExposure.defenseAreas
 */
export const RISK_AREAS: Record<RiskAreaEnum, RiskAreaConstants> = {
  [RiskAreaEnum.SPAM_RESISTANCE]: {
    title: "Spam Resistance",
    titleAbbreviation: "SR",
    description: [
      "Protects the system from being overwhelmed by malicious or low-quality proposals, which can waste resources, discourage meaningful participation, and expose the DAO to a war of attrition.",
      "This risk typically arises when there are no checks to submit proposals, or when existing safeguards can be bypassed or ignored.",
    ],
    requirements: [
      GovernanceImplementationEnum.SPAM_RESISTANCE,
      GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION,
      GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION,
      GovernanceImplementationEnum.PROPOSAL_THRESHOLD,
      GovernanceImplementationEnum.VOTING_PERIOD,
      GovernanceImplementationEnum.VOTING_SUBSIDY,
    ],
  },
  [RiskAreaEnum.ECONOMIC_SECURITY]: {
    title: "Economic Security",
    titleAbbreviation: "ES",
    description:
      "Ensures the cost of attacking the DAO exceeds potential gains, making governance attacks economically unfeasible.",
    requirements: [GovernanceImplementationEnum.ATTACK_PROFITABILITY],
  },
  [RiskAreaEnum.SAFEGUARDS]: {
    title: "Safeguards",
    titleAbbreviation: "SG",
    description:
      "Emergency mechanisms and checks to prevent or cancel malicious proposals before they can be executed.",
    requirements: [
      GovernanceImplementationEnum.VETO_STRATEGY,
      GovernanceImplementationEnum.SECURITY_COUNCIL,
      GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL,
      GovernanceImplementationEnum.VOTING_SUBSIDY,
    ],
  },
  [RiskAreaEnum.CONTRACT_SAFETY]: {
    title: "Contract Safety",
    titleAbbreviation: "CS",
    description:
      "Ensures governance contracts are secure, audited, and protected from exploits or vulnerabilities.",
    requirements: [
      GovernanceImplementationEnum.AUDITED_CONTRACTS,
      GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION,
      GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION,
    ],
  },
  [RiskAreaEnum.RESPONSE_TIME]: {
    title: "Response Time",
    titleAbbreviation: "RT",
    description:
      "Provides sufficient time windows for the community to detect, react to, and mobilize against malicious proposals.",
    requirements: [
      GovernanceImplementationEnum.TIMELOCK_DELAY,
      GovernanceImplementationEnum.VOTING_DELAY,
      GovernanceImplementationEnum.VOTING_PERIOD,
    ],
  },
  [RiskAreaEnum.GOV_FRONTEND_RESILIENCE]: {
    title: "Gov Front-end Resilience",
    titleAbbreviation: "GR",
    description:
      "Protects the governance interface from being compromised, hijacked, or manipulated to mislead voters.",
    requirements: [
      GovernanceImplementationEnum.INTERFACE_RESILIENCE,
      GovernanceImplementationEnum.VOTE_MUTABILITY,
      GovernanceImplementationEnum.VETO_STRATEGY,
    ],
  },
};
