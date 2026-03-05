/**
 * @file recommended-settings.ts
 * Universal recommended settings for governance implementation parameters
 * These recommendations apply to all DAOs and represent best practices
 */

import { GovernanceImplementationEnum } from "@/shared/types/enums";

/**
 * Recommended settings for each governance implementation parameter
 * These are shared across all DAOs as baseline security standards
 */
export const RECOMMENDED_SETTINGS: Record<
  GovernanceImplementationEnum,
  string
> = {
  [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]:
    "The DAO has a protection mechanism that prevents an attacker from using a flash loan to reach the required number of tokens to submit a proposal.",

  [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]:
    "The DAO has a protection mechanism that prevents an attacker from using a flash loan to improve their governance power.",

  [GovernanceImplementationEnum.TIMELOCK_DELAY]:
    "The Timelock has a waiting period (delay) of at least one day to execute an approved proposal in the DAO.",

  [GovernanceImplementationEnum.VOTING_DELAY]:
    "The waiting period between the proposal submission and the snapshot of voting power must be more than two days. In addition, the DAO needs to have an activation plan to contact delegates and stakeholders to mobilize their votes in case of an attack.",

  [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]:
    "The threshold to submit proposals in a DAO needs to be at least 1% of the token's market supply - a sum of governance tokens deposited on centralized exchanges, DEXs and lending markets.",

  [GovernanceImplementationEnum.VETO_STRATEGY]:
    "A safeguard to veto malicious proposals submitted through on-chain governance must be controlled by the DAO itself to achieve the highest Anticapture security standard.",

  [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]:
    "Upon submitting a proposal, a governance participant must be required to maintain their voting power above the Proposal Threshold; otherwise, the proposal shall be permissionless to cancel.",

  [GovernanceImplementationEnum.VOTING_PERIOD]:
    "The period between the start and end of a proposal must be at least seven days.",

  [GovernanceImplementationEnum.VOTE_MUTABILITY]:
    "The ability to change a vote during the voting period must be provided by the DAO. This mechanism allows voters to withdraw their votes and stop a malicious proposal if the governance interface is compromised.",

  [GovernanceImplementationEnum.VOTING_SUBSIDY]:
    "Gas fee subsidies for governance voters must be provided to lower the barrier to participation in on-chain proposals.",

  [GovernanceImplementationEnum.SPAM_RESISTANCE]:
    "Mechanisms should be in place to limit the number of proposals that can be submitted by a single address to prevent governance spam attacks.",

  [GovernanceImplementationEnum.AUDITED_CONTRACTS]:
    "All governance contracts should be audited by reputable security firms and audit reports should be publicly available.",

  [GovernanceImplementationEnum.INTERFACE_RESILIENCE]:
    "The domain should be protected with standard security certificates, made public by its provider. Ideal security here includes a verified front-end, deployed in an immutable manner, linked to an ENS record by the DAO in a domain like vote.DAO.eth and made available through .limo or .link or equivalent.",

  [GovernanceImplementationEnum.ATTACK_PROFITABILITY]:
    "The cost of acquiring voting power should exceed the potential profit from attacking the treasury. Security councils or veto mechanisms are recommended when treasury value is high.",

  [GovernanceImplementationEnum.SECURITY_COUNCIL]:
    "A Security Council should be established following best practices (e.g., L2Beat standards) with clear mandate, transparent operations, and regular renewal of authority.",

  [GovernanceImplementationEnum.TIMELOCK_ADMIN]:
    "The control of the Timelock must be carried out solely by the DAO.",
};
