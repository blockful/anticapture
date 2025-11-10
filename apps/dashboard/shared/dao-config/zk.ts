import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { ZKIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";

export const ZK: DaoConfiguration = {
  name: "ZKSync",
  decimals: 18,
  color: {
    svgColor: "#000000",
    svgBgColor: "#FFFFFF",
  },
  icon: ZKIcon,
  daoOverview: {
    token: "ERC20",
    chain: mainnet,
    contracts: {
      governor: "0xb83FF6501214ddF40C91C9565d095400f3F45746",
      token: "0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E",
      timelock: "0xe5d21A9179CA2E1F0F327d598D464CcF60d89c3d",
    },
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: true,
      logic: "For + Abstain",
      quorumCalculation: "3% Minted Supply (630M $ZK)",
      proposalThreshold: "210M (0,1% Minted Supply)",
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    supportsLiquidTreasuryCall: false,
    attackCostBarChart: {},
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
        riskExplanation: "zkSync contracts are audited.",
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
        value: "5,2% Market Supply",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        riskExplanation:
          "The supply available for purchase of governance tokens is extremely low—and the proposal threshold is high in relation to it.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
        requirements: [""],
        riskExplanation: "",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        riskExplanation: "zkSync has a Security Council.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        requirements: [""],
        riskExplanation: "",
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
        value: "6 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        riskExplanation: "Six days is a sufficient delay for Timelock.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        riskExplanation: "",
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        requirements: [
          "zkSync must allow votes to be changed even after they have been cast.",
        ],
        riskExplanation:
          "The lack of vote mutability jeopardizes DAO decisions if its main voting interface is attacked.",
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "6 days",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        riskExplanation: "",
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
        value: "6 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        riskExplanation: ".",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        requirements: [""],
        riskExplanation: ".",
      },
    },
  },
  riskAnalysis: true,
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
