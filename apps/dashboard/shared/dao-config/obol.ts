import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { ObolIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";

export const OBOL: DaoConfiguration = {
  name: "Obol Collective",
  decimals: 18,
  color: {
    svgColor: "#4a90e2",
    svgBgColor: "#e8f2ff",
  },
  icon: ObolIcon,
  daoOverview: {
    token: "ERC20",
    chain: mainnet,
    snapshot: "",
    contracts: {
      governor: "0xcB1622185A0c62A80494bEde05Ba95ef29Fbf85c",
      token: "0x0B010000b7624eb9B3DfBC279673C76E9D29D5F7",
      timelock: "0xCdBf527842Ab04Da548d33EB09d03DB831381Fb0",
    },
    cancelFunction:
      "https://etherscan.io/address/0xcb1622185a0c62a80494bede05ba95ef29fbf85c#writeContract#F1",
    tally: "https://www.tally.xyz/gov/obol",
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: true,
      logic: "For + Abstain",
      quorumCalculation: QUORUM_CALCULATION_TYPES.OBOL,
      proposalThreshold: "30K $OBOL",
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    supportsLiquidTreasuryCall: false,
    attackCostBarChart: {},
  },
  riskAnalysis: true,
  governanceImplementation: {
    fields: {
      [GovernanceImplementationEnum.AUDITED_CONTRACTS]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.AUDITED_CONTRACTS
          ].description,
        requirements: [
          "Governance contracts must be audited by a reputable third-party security firm and the audit report should be publicly available.",
        ],
        riskExplanation:
          "Governance contracts are not audited, or not publicly disclosed.",
      },
      [GovernanceImplementationEnum.INTERFACE_HIJACK]: {
        value: "Insufficient Protections",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
        requirements: [
          "Voting domain must have CAA set up to prevent domain hijacking.",
        ],
        riskExplanation:
          "While a domain can function without a CAA record, but it is less secure because any certificate authority (CA) can issue certificates for that domain, creating a risk of fraudulent certificates, impersonation, and man-in-the-middle attacks.",
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        value: "No Treasury Control",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        riskExplanation:
          "The DAO has no treasury directly controllable by governance, so there is no risk of attack profitability.",
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "Voting power is based on block previous to when voters could first cast a vote, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "30K $OBOL (0.006% Total Supply)",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        requirements: [
          "Proposal threshold should be at least 1% of the active market supply to provide adequate protection against spam and malicious proposals.",
        ],
        riskExplanation:
          "The proposal threshold is less than 1% of the active market supply of $OBOL.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
        requirements: [
          "The DAO must enforce a permissionless way to cancel any live proposal if the proposer's voting power drops below the proposal-creation threshold.",
        ],
        riskExplanation:
          "Once a proposal is submitted, the proposer can immediately dump their tokens, reducing their financial risk in case of an attack.",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "Yes",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        requirements: [
          "The Obol Security Council must upgrade its multisig to the highest standard, with at least 8 signers and a 75% approval threshold for transactions.",
        ],
        riskExplanation:
          "As of now, Obol Collective functions with a small committee multi-sig (2/3) but intends to develop towards a full Security Council structure. Treasury is not controlled by governance, but malicious proposals may still pose a risk to the protocol and its users.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        requirements: [
          "Obol has no limit on active proposals or proposals submitted per address. Thus, it is susceptible to spam in its governance.",
        ],
        riskExplanation: "Obol governance is vulnerable to spam.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "Obol Governor",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        riskExplanation:
          "Obol Governor has admin rights for proposing, executing, and cancelling proposals, which is a standard and secure setup for DAO governance.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "5 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        riskExplanation: "The timelock delay is longer than 1 day",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        riskExplanation:
          "Governor has veto powers over the timelock, providing an additional layer of security against malicious proposals.",
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        requirements: [
          "Without the ability to change votes, voters cannot correct mistakes or respond to new information, potentially leading to suboptimal governance outcomes.",
        ],
        riskExplanation:
          "Votes cannot be changed once cast, which can lead to suboptimal governance outcomes if voters make mistakes or if new information arises after voting has begun.",
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "1 day",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        requirements: [
          "A minimum of 2 days of Voting Delay is required for a DAO to be considered secure in this parameter.",
        ],
        riskExplanation:
          "With such a low voting delay, the DAO does not have time to mobilize voters to protect itself from a potential attack.",
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "Voting power is based on the proposal snapshot timepoint, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "5 days",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        requirements: [
          "Voting period should be at least 7 days to allow adequate time for community discussion and participation.",
        ],
        riskExplanation:
          "Short voting period may compromise quality of governance decisions by limiting time available for community-wide discussion and participation.",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        riskExplanation:
          "Obol Collective has a voting subsidy mechanism in place to reimburse voters for gas costs incurred when voting on proposals, but it is not active as of now.",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
