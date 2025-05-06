/**
 * Enum representing all the governance implementation features
 * that can be implemented by a DAO to reduce risk
 */
export enum GovernanceImplementationEnum {
  SPAM_RESISTANCE = "Spam Resistance",
  FLASH_LOAN_PROTECTION = "Flash Loan Protection",
  PROPOSAL_THRESHOLD = "Proposal Threshold",
  CANCEL_FUNCTION = "Cancel Function",
  VOTING_PERIOD = "Voting Period",
  VOTING_SUBSIDY = "Voting Subsidy",
  EXTRACTABLE_VALUE = "Extractable Value",
  VETO_STRATEGY = "Veto Strategy",
  SECURITY_COUNCIL = "Security Council",
  PROPOSER_BALANCE_CANCEL = "Proposer Balance Cancel",
  VOTING_SUBSIDY_CONTRACTS = "Voting Subsidy on contracts",
  VOTING_SUBSIDY_UIS = "Voting Subsidy on UIs",
  AUDITED_CONTRACTS = "Audited Contracts",
  TIMELOCK_DELAY = "Timelock Delay",
  TIMELOCK_ADMIN = "Timelock Admin",
  VOTING_DELAY = "Voting Delay",
  DNS_PROTECTION = "DNS Protection",
  VOTE_MUTABILITY = "Vote Mutability",
} 