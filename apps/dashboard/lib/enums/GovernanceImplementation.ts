/**
 * Enum representing all the governance implementation features
 * that can be implemented by a DAO to reduce risk
 */
export enum GovernanceImplementationEnum {
  AUDITED_CONTRACTS = "Audited Contracts",
  DNS_PROTECTION = "DNS Protection",
  EXTRACTABLE_VALUE = "Extractable Value",
  PROPOSAL_FLASHLOAN_PROTECTION = "Proposal Flashloan Protection",
  PROPOSAL_THRESHOLD = "Proposal Threshold",
  PROPOSER_BALANCE_CANCEL = "Proposer Balance Cancel",
  PROPOSAL_THRESHOLD_CANCEL = "Proposal Threshold Cancel",
  SECURITY_COUNCIL = "Security Council",
  SPAM_RESISTANCE = "Spam Resistance",
  TIMELOCK_ADMIN = "Timelock Admin",
  TIMELOCK_DELAY = "Timelock Delay",
  VETO_STRATEGY = "Veto Strategy",
  VOTE_MUTABILITY = "Vote Mutability",
  VOTING_FLASHLOAN_PROTECTION = "Voting Flashloan Protection",
  VOTING_PERIOD = "Voting Period",
  VOTING_SUBSIDY = "Voting Subsidy",
  VOTING_DELAY = "Voting Delay",
}
