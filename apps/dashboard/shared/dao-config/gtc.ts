import { DaoConfiguration } from "@/shared/dao-config/types";
import {
  RiskLevel,
  SupportStageEnum,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { GitcoinIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";

export const GTC: DaoConfiguration = {
  name: "Gitcoin",
  supportStage: SupportStageEnum.FULL,
  icon: GitcoinIcon,
  daoOverview: {
    chain: mainnet,
    snapshot: "https://snapshot.box/#/s:gitcoindao.eth",
    contracts: {
      governor: "0x9D4C63565D5618310271bF3F3c01b2954C1D1639",
      token: "0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F",
      timelock: "0x57a8865cfB1eCEf7253c27da6B4BC3dAEE5Be518",
    },
    cancelFunction:
      "https://etherscan.io/address/0x57a8865cfB1eCEf7253c27da6B4BC3dAEE5Be518#writeContract#F2",
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: true,
      logic: "For + Abstain",
      quorumCalculation: "Total Supply",
      proposalThreshold: "150k GTC",
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.HIGH,
    supportsLiquidTreasuryCall: true,
    attackCostBarChart: {
      OptimismTimelock: "",
      OptimismTokenDistributor: "",
      OptimismUniv3Uni: "",
    },
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
        riskExplanation:
          "The contracts have been audited for smart contract security.",
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
          "Currently, the DAO’s domains have no publicly verifiable DNS-level protections (High Risk).",
          "Secure every DAO‑owned domain with Industry standard and publish a security‑contact record.",
        ],
        riskExplanation:
          "The DAO's domains have no publicly verifiable DNS-level protections we are aware of.",
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        value: "~$500k",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        requirements: [
          "Increase the deegation supply and active voter set to lower the profitability of an attacker.",
          "Get the delegated supply above the value directly available for proposal execution.",
        ],
        riskExplanation:
          "The liquid treasury of the DAO is ~$500k bigger than its current delegated supply..",
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "The DAO is not vulnerable to proposal flashloan attacks.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "150k GTC",
        riskLevel: RiskLevel.NONE,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        riskExplanation:
          "The proposal threshold is 150k GTC, which is the minimum amount of GTC required to propose a new proposal. The level of risk of this depends on the liquidity on markets.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
        requirements: [
          "Stablish a defense system that allows the DAO to cancel proposals if the original proposer doesn't have the required amount of GTC to meet threshold any longer.",
        ],
        riskExplanation:
          "Currently an attacker can propose by holding enough tokens, dump them on the market and the proposal would stay valid.",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "No",
        riskLevel: RiskLevel.NONE,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        riskExplanation: "The DAO has no security council.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        requirements: [
          "The DAO should establish a system to stop proposers from having multiple proposals at the same time.",
        ],
        riskExplanation:
          "Currently, an attacker can submit multiple proposals and cause a war of attrition against defending delegates.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "No",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        riskExplanation:
          "There's no external entity with control to the timelock roles.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        riskExplanation:
          "The timelock delay of two days gives time for the DAO to respond before execution.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "No",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        riskExplanation: "The DAO has no veto strategy.",
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        requirements: [
          "If voters cannot revise their ballots, a last-minute interface exploit or late discovery of malicious code can trap delegates in a choice that now favors an attacker, weakening the DAO’s defense.",
          "The governance contract should let any voter overwrite their previous vote while the voting window is open—ideally through an adapted castVoteWithReasonAndParams call or equivalent.",
        ],
        riskExplanation:
          "In case of an exploit that affects the voting platforms, immutable votes can leave delegates stuck with a incorrect vote made in a compromised interface.",
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "44 hours",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        requirements: [
          "Voting delay is the time between proposal submission and the snapshot that fixes voting power. The current 44 hours delay is the time to redelegate and activate delegates before voting starts.",
          "Our standard for low risk is of at least 2 days, to give time for a coordinated response with holders that need to redelegate in case of an attacker",
        ],
        riskExplanation:
          "With less than 2 days of voting delay, token holders might miss the chance to delegate in support of the DAOs defense",
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "Delegates voting power are based on its delegation on block previous to when they could first cast a vote, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "5 days and 14 hours",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        requirements: [
          "The voting period is 5 days and 14 hours, with the recommended safety being of 7 or more for a low level of risk.",
          "Increase the voting period to allow for more delegates to participate in the voting process. and increase attack costs.",
        ],
        riskExplanation:
          "The voting period is 5 days and 14 hours, with the recommended safety being of 7 or more for a low level of risk.",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        requirements: [
          "The voting subsidy is not applied, requiring delegates to pay gas on the proposals they vote on.",
          "With no voting subsidy, the structure is more vulnerable to spam attacks, as it's more costly for the defense than the attacker",
          "The Foundation is the only allowed proposer, so the risk of spam attacks are low. Still, the DAO should consider applying a voting subsidy to make its structure more resilient.",
        ],
        riskExplanation:
          "The voting subsidy is not applied, requiring delegates to pay gas on the proposals they vote on.",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
