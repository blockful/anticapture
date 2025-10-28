import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { ScrollIcon } from "@/shared/components/icons";
import { scroll } from "viem/chains";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";

export const SCR: DaoConfiguration = {
  name: "Scroll",
  icon: ScrollIcon,
  daoOverview: {
    token: "ERC20",
    chain: scroll,
    blockTime: 1.5,
    snapshot: "",
    contracts: {
      governor: "0x2f3f2054776bd3c2fc30d750734a8f539bb214f0",
      token: "0xd29687c813D741E2F938F4aC377128810E217b1b",
      timelock: "0x79D83D1518e2eAA64cdc0631df01b06e2762CC14",
    },
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: false,
      logic: "For + Abstain + Against",
      quorumCalculation: QUORUM_CALCULATION_TYPES.SCROLL,
      proposalThreshold: "50M $SCR",
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
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.AUDITED_CONTRACTS
          ].description,
        riskExplanation: "Governance contracts are audited.",
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
          "Secure every DAO‑owned domain with Industry standard and publish a security‑contact record.",
        ],
        riskExplanation:
          "The domain is not signed with a valid signature (DNSSEC) and it is not possible to establish a secure connection to it (HTTPS).",
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
          "Voting power are based on block previous to when voters could first cast a vote, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "5% Total Supply",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        riskExplanation:
          "The proposal threshold is greater than 1% of the active market supply of $SCR.",
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
        value: "No",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        riskExplanation:
          "Although it does not have a Security Council, the DAO has no control over Scroll's' capital. Therefore, there is no risk, because the DAO does not control anything.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        requirements: [
          "Scroll has no limit on active proposals or proposals submitted per address. With a low proposal threshold, it is susceptible to spam in its governance.",
        ],
        riskExplanation: "Scroll governance is vulnerable to spam proposals.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        riskExplanation:
          "Governance powers fully enforced via Timelock, not upgradeable by EOA or central party",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "3 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        riskExplanation: "The timelock delay is higher than 1 day.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        requirements: [
          "Veto strategy should be fully controlled by the DAO in order to have a low risk level.",
        ],
        riskExplanation:
          "There is a veto strategy controlled by the Timelock itself and Security Council multisig.",
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        requirements: [
          "Without the ability to change votes after they are cast, voters cannot respond to new information or changes in sentiment.",
        ],
        riskExplanation:
          "The mutability of the vote is fundamental to allow voters to change their vote in response to new information or changes in sentiment.",
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "3 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        riskExplanation:
          "With three days, Scroll has enough time to gather votes and delegates with the goal of blocking a malicious proposal in the DAO.",
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "Voting power is based on block previous to when voters could first cast a vote, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "7 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        riskExplanation:
          "Seven days is enough time for the DAO to organize itself against an attack during the voting period.",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        requirements: [
          "Introduce a voting subsidy mechanism to encourage higher voter turnout and reduce voter attrition in times of need.",
        ],
        riskExplanation:
          "The voting subsidy is not applied, requiring voters to pay gas on the proposals they vote on.",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
