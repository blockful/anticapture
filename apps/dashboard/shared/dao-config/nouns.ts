import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { NounsIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";

export const NOUNS: DaoConfiguration = {
  name: "Nouns",
  decimals: 0,
  color: {
    svgColor: "#000000",
    svgBgColor: "#FFFFFF",
  },
  icon: NounsIcon,
  daoOverview: {
    token: "ERC721",
    blockTime: 12,
    chain: mainnet,
    snapshot: "",
    contracts: {
      governor: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d",
      token: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03",
      timelock: "0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71",
    },
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: true,
      logic: "For",
      quorumCalculation: "10-15% Dynamic Quorum",
      proposalThreshold: "3 $NOUN (>0,25% Adjusted Supply)",
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    supportsLiquidTreasuryCall: false,
    attackCostBarChart: {
      NounsTimelock: "0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71",
      PayerContract: "0xd97Bcd9f47cEe35c0a9ec1dc40C1269afc9E8E1D",
      ClientIncentivesRewardsProxy:
        "0x883860178F95d0C82413eDc1D6De530cB4771d55",
      //PayerContract and ClientIncentivesRewardsProxy are controlled by Timelock.
    },
  },
  governanceImplementation: {
    // Fields are sorted alphabetically by GovernanceImplementationEnum for readability
    fields: {
      [GovernanceImplementationEnum.AUDITED_CONTRACTS]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.AUDITED_CONTRACTS
          ].description,
        riskExplanation: "Nouns contracts are audited.",
      },
      [GovernanceImplementationEnum.INTERFACE_HIJACK]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
        requirements: [
          "Without the proper protections(DNSSEC/SPF/DKIM/DMARC), attackers can spoof governance UIs by hijacking unprotected domains.",
        ],
        riskExplanation:
          "The domain is not signed with a valid signature (DNSSEC) and it is not possible to establish a secure connection to it (HTTPS).",
      },
      // Quantify the profitability of an attack on Nouns.
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        value: "",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        requirements: [""],
        riskExplanation: "",
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "Voting power are based on block previous to when voters could first cast a vote, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "30% Market Supply",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        riskExplanation:
          "The supply available for purchase of governance tokens is extremely low—and the proposal threshold is high in relation to it.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
        riskExplanation:
          "Nouns has a cancellation mechanism in place in case the balance of the person submitting a proposal falls below the proposal threshold.",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "No",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        riskExplanation:
          "Nouns does not have a Security Council, but it does have protection mechanisms—a Veto Strategy and the Proposal Threshold Cancel.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "YES",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        riskExplanation:
          "Nouns prevents the same address from submitting multiple proposals in governance.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        riskExplanation: "The Timelock is controlled by the Governor.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        riskExplanation: "Two days is a sufficient delay for Timelock.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        requirements: [
          "To move up to Stage 2 (low risk), the veto strategy needs to be controlled by the DAO, not by a Foundation/DUNA. ",
        ],
        riskExplanation:
          "Nouns has a veto strategy in place, but only the Foundation can veto proposals. In the documentation, the veto is attributed to DUNA, but no one responsible for the veto has been named yet.",
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        requirements: [
          "Nouns must allow votes to be changed even after they have been cast in order to reach Stage 2. .",
        ],
        riskExplanation:
          "The lack of vote mutability jeopardizes DAO decisions if its main voting interface is attacked.",
      },
      // Review this
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "12 hours",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        requirements: [
          "Nouns must have a voting delay of at least 2 days to be classified as Stage 1 (medium risk).",
        ],
        riskExplanation:
          "The 12-hour voting delay is too short for the DAO to protect itself from an attack before voting begins.",
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "Voting power are based on block previous to when voters could first cast a vote, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "4 days",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        requirements: [
          "The voting period is 4 days, with the recommended safety being of 7 or more for a low level of risk.",
        ],
        riskExplanation:
          "The voting period is 4 days, with the recommended safety being of 7 or more for a low level of risk.",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        riskExplanation:
          "Nouns subsidizes the cost of votes for participants in governance.",
      },
    },
  },
  riskAnalysis: true,
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
