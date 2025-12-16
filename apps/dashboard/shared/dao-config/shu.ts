import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { ShutterIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";

export const SHU: DaoConfiguration = {
  name: "Shutter",
  decimals: 18,
  color: {
    svgColor: "#0080bc",
    svgBgColor: "#fff",
  },
  forumLink: "https://shutternetwork.discourse.group/c/shutter-dao/14",
  icon: ShutterIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    snapshot: "https://snapshot.box/#/s:shutterdao0x36.eth/",
    contracts: {
      governor: "0x36bD3044ab68f600f6d3e081056F34f2a58432c4",
      token: "0xe485E2f1bab389C08721B291f6b59780feC83Fd7",
      timelock: "0x36bD3044ab68f600f6d3e081056F34f2a58432c4",
    },
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: false,
      logic: "For + Abstain",
      quorumCalculation: QUORUM_CALCULATION_TYPES.TOTAL_SUPPLY,
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.HIGH,
    supportsLiquidTreasuryCall: false,
    attackCostBarChart: {},
  },
  riskAnalysis: true,
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
      },
      [GovernanceImplementationEnum.INTERFACE_HIJACK]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        value: "~100M USD",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "100k SHU",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ].description,
        requirements: [
          "Once a proposal is submitted, the proposer can immediately dump their tokens, reducing their financial risk in case of an attack.",
          "The DAO must enforce a permissionless way to cancel any live proposal if the proposer's voting power drops below the proposal-creation threshold.",
        ],
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "12 seconds",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes(default)",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "7 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
  governancePage: true,
};
