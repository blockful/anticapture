import { RiskLevel, SupportStageEnum } from "@/shared/types/enums";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { GovernanceImplementationEnum } from "@/shared/types/enums/GovernanceImplementation";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { UniswapIcon } from "@/shared/components/icons";

export const UNI: DaoConfiguration = {
  name: "Uniswap",
  supportStage: SupportStageEnum.FULL,
  icon: UniswapIcon,
  daoOverview: {
    chainId: 1,
    contracts: {
      governor: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
      token: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      timelock: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
    },
    cancelFunction:
      "https://etherscan.io/address/0x1a9C8182C09F50C8318d769245beA52c32BE35BC#writeContract%23F2",
    snapshot: "https://snapshot.box/#/s:uniswapgovernance.eth",
    tally: "https://tally.xyz/gov/uniswap",
    rules: {
      delay: true,
      changeVote: true,
      timelock: true,
      cancelFunction: true,
      logic: "For",
      quorumCalculation: "Total Supply",
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
          "Currently, the DAO’s domains have no DNS-level protections (High Risk).",
          "Secure every DAO‑owned domain with Industry standard and publish a security‑contact record.",
        ],
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        value: "<10k USD",
        riskLevel: RiskLevel.LOW,
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
        value: "1M UNI",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ].description,
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "Only Governor",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        requirements: [
          "The timelock admin can control execution, canceling, upgrades or critical parameter changes; if this power sits outside audited, DAO-approved contracts, attackers or insiders can sidestep on-chain voting.",
          "Admin rights should rest only with DAO governance plus contracts it explicitly approves after a public audit.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        requirements: [
          "If ballots can’t be changed, a late‑discovered UI exploit or code bug can trap delegates in a now‑malicious vote, weakening defenses.",
          "Currently, votes become immutable once cast (Medium Risk).",
          "Upgrade governance so any voter can overwrite their vote until the voting window closes (e.g. via castVoteWithReasonAndParams).",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "44h",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        requirements: [
          "A short window between proposal submission and the voting snapshot lets attackers rush malicious items through before delegates mobilize.",
          "Currently, the delay is 44 h (Medium Risk).",
          "Enforce a delay of ≥ 48 h and deploy an automatic delegate‑alert system when a proposal is queued.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "5d 6h",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        requirements: [
          "A voting window under seven days risks excluding weekend or time‑zoned delegates, lowering turnout and quorum.",
          "Currently, voting lasts 5 d 6 h (Medium Risk).",
          "Increase the period to ≥ 7 days so all delegates have time to participate.",
        ],
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
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    supportsLiquidTreasuryCall: false,
    attackCostBarChart: {
      UniTimelock: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
      UniTokenDistributor: "0x090D4613473dEE047c3f2706764f49E0821D256e",
      Univ3Uni: "0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801",
    },
  },
  riskAnalysis: true,
  tokenDistribution: true,
  resilienceStages: true,
  dataTables: false,
};
