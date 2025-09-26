import { DaoConfiguration, QuorumTypeEnum } from "@/shared/dao-config/types";
import {
  RiskLevel,
  SupportStageEnum,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { OptimismIcon } from "@/shared/components/icons";
import { optimism } from "viem/chains";

export const OP: DaoConfiguration = {
  name: "Optimism",
  supportStage: SupportStageEnum.FULL,
  noStage: true,
  icon: OptimismIcon,
  daoOverview: {
    chain: optimism,
    snapshot: "https://snapshot.box/#/s:citizenshouse.eth",
    contracts: {
      governor: "0xcDF27F107725988f2261Ce2256bDfCdE8B382B10",
      token: "0x4200000000000000000000000000000000000042",
      timelock: "0x0eDd4B2cCCf41453D8B5443FBB96cc577d1d06bF",
    },
    cancelFunction:
      "https://optimistic.etherscan.io/address/0xcDF27F107725988f2261Ce2256bDfCdE8B382B10#writeProxyContract#F1",
    rules: {
      delay: false,
      changeVote: false,
      timelock: true,
      cancelFunction: true,
      logic: "All Votes Cast",
      quorumCalculation: QuorumTypeEnum.DELEGATED_SUPPLY,
      proposalThreshold: "Only Foundation Proposes",
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    supportsLiquidTreasuryCall: false,
    attackCostBarChart: {
      OptimismTimelock: "",
      OptimismTokenDistributor: "",
      OptimismUniv3Uni: "",
    },
    dynamicQuorum: {
      percentage: 0.3,
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
          "The contracts, provided by Agora.xyz, have been audited for smart contract security.",
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
        value: "No Treasury Control",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        requirements: [
          "The DAO has no treasury directly controllable by governance, so there is no risk of attack profitability.",
          "The treasury risks in the Collective are related to mistakes or malicious actions by the Foundation.",
        ],
        riskExplanation:
          "The DAO has no treasury directly controllable by governance, so there is no way to calculate attack profitability.",
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        value: "Only Foundation Proposes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
        requirements: [
          "The Foundation, as manager of the contract, is the only one that can propose, so there's no risk of proposal flashloan attacks.",
          "The flashloan protection in the contract is commented out, due to the onlyManagerOrTimelock bein used on the propose() function.",
        ],
        riskExplanation:
          "The Foundation, as manager of the contract, is the only one that can propose, so there's no risk of proposal flashloan attacks.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "Only Foundation Proposes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        requirements: [
          "The proposal threshold is 0, but the propose() function is only callable by the manager, which is the Foundation.",
        ],
        riskExplanation:
          "The proposal threshold is 0, but the propose() function is only callable by the manager, which is the Foundation. All proposals are made in the forum and brought onchain by a centralized manager.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "Only Foundation Can Cancel",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
        requirements: [
          "Only the manager, timelock or proposer can cancel a proposal. As the manager is also the only possible proposer, this means only the manager (OP Foundation) can propose or cancel proposals.",
        ],
        riskExplanation:
          "The proposal cancel function is only callable by the manager, which is the Foundation.",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        riskExplanation:
          "The Security Council is elected in 2 separate cohorts of members that are responsible for the security of the DAO. The Security Council is not active on DAO governance, but directly on protocol upgrades.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "Does not apply",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        riskExplanation:
          "The Foundation is both the only allowed proposer and the treasury manager, so there's no risk of a spam attack given that any compromise to the foundation would lead directly to a treasury drain.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "No",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        riskExplanation:
          "The timelock holds no assets and is not used for governance execution.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "Does not apply",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        riskExplanation: "The timelock is not used for governance execution.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Does not apply",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        riskExplanation:
          "Proposals are not executed by the timelock, but by the Foundation's multisig, so the Foundation can veto proposals by calling the cancel() function during voting, or by just not executing the proposal after approved.",
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
        value: "0 seconds",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        requirements: [
          "Voting delay is the time between proposal submission and the snapshot that fixes voting power. The current 0 blocks delay means proposals are live for voting as soon as created by the Foundation.",
          "The DAO should enforce a delay of at least two full days and have an automatic alert plan that notifies major voters the moment a proposal is posted.",
          "The Foundation is the only allowed proposer, and it follows a voting schedule, so there's no reason to have a voting delay.",
        ],
        riskExplanation:
          "The Foundation is the only allowed proposer, and it follows a voting schedule, so there's no reason to have a voting delay.",
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
        value: "6 days",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        requirements: [
          "The voting period is 6 days, with the recommended safety being of 7 or more for a low level of risk.",
          "The Foundation is the only allowed proposer, and it follows a voting schedule, reducing the impact of this risk.",
        ],
        riskExplanation:
          "The voting period is 6 days, with the recommended safety being of 7 or more for a low level of risk.",
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
