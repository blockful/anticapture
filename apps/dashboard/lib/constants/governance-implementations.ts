import { GovernanceImplementationEnum } from "@/lib/enums/GovernanceImplementation";

export const GOVERNANCE_IMPLEMENTATION_CONSTANTS = {
    [GovernanceImplementationEnum.AUDITED_CONTRACTS]: {
      description: "The governance contract codes have been audited and approved by a security provider.",
    },
    [GovernanceImplementationEnum.DNS_PROTECTION]: {
      description: "Protection against Domain Name Service attacks on the domains/websites used by the DAO.",
    },
    [GovernanceImplementationEnum.EXTRACTABLE_VALUE]: {
      description: "Compares the cost of all delegated votes with the value of assets in the DAO treasury excluding its governance tokens.",
    },
    [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
      description: "Protects the DAO from users creating a proposal using voting power from borrowed tokens via flash loan.",
    },
    [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
      description: "The minimum number of votes required to create a proposal.",
    },
    [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
      description: "Allow for any user to cancel the proposer of an address if that address no longer holds the necessary voting power to pass proposal threshold while their proposal is still active.",
    },
    [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
      description: "Whether a proposal may be canceled if the wallet that submitted it no longer has the number of governance tokens required to reach the proposal threshold.",
    },
    [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
      description: "Group of people responsible for taking action to increase the DAO's security against harmful proposals through a multisig administered by them.",
    },
    [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
      description: "Protection against an attacker submitting several proposals at once to trick the organization's members into approving a malicious proposal.",
    },
    [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
      description: "Controls whether governor's administration can be transferred or shared with addresses other than the DAO itself.",
    },
    [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
      description: "Waiting period to execute a proposal after it's approved. Aims to prevent the automatic execution of a malicious proposal that negatively affects the DAO.",
    },
    [GovernanceImplementationEnum.VETO_STRATEGY]: {
      description: "Allows governance members to cancel a proposal submitted to the DAO after it has been submitted/approved.",
    },
    [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
      description: "The governance contract accepts changes to votes even after they have been cast on-chain.",
    },
    [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
      description: "Protects the DAO from users manipulating votes using voting power from borrowed tokens via flash loan.",
    },
    [GovernanceImplementationEnum.VOTING_PERIOD]: {
      description: "Period in which wallets with governance tokens or delegates have the opportunity to vote on proposals submitted to governance.",
    },
    [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
      description: "The DAO sponsoring the gas costs of voting for its members allowing them to essentially 'vote for free'.",
    },
    [GovernanceImplementationEnum.VOTING_DELAY]: {
      description: "Waiting period between proposal submission and the snapshot to count for voting power and start the votes.",
    },
  }