import { RiskLevel, SupportStageEnum } from "@/shared/types/enums";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { GovernanceImplementationEnum } from "@/shared/types/enums/GovernanceImplementation";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { UniswapIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";

export const UNI: DaoConfiguration = {
  name: "Uniswap",
  color: {
    svgColor: "#fc72ff",
    svgBgColor: "#FFF2FB",
  },
  forumLink: "https://gov.uniswap.org/",
  supportStage: SupportStageEnum.FULL,
  icon: UniswapIcon,
  daoOverview: {
    chain: mainnet,
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
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
        requirements: [
          "For maximum security, the DAO should have its frontend reviewed by the DAO or audit and then made verifiably immutable",
          "A solution could look like a frontend made available on IPFS through eth.limo, with their code hashed and put on chain by the DAO, then verified for subresource integrity",
          "The governance interface used (Tally) has the standard protections to prevent external tampering with the frontend accessed",
          "The platform is still exposed to any malicious or compromised actors inside the interface provider team",
        ],
        riskExplanation: `Although protected from spoofing or hijacking, the service used for voting could still be internally compromised.\n
          A change in the voting interface could be used to manipulate the results of the vote, hiding malicious txns, or even changing selection of votes.`,
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
  dataTables: true,
};
