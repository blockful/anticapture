import { mainnet } from "viem/chains";

import { ObolIcon } from "@/shared/components/icons";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { ObolOgIcon } from "@/shared/og/dao-og-icons";
import {
  RiskLevel,
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";

export const OBOL: DaoConfiguration = {
  name: "Obol Collective",
  decimals: 18,
  color: {
    svgColor: "#0F7C76",
    svgBgColor: "#e8f2ff",
  },
  icon: ObolIcon,
  ogIcon: ObolOgIcon,
  noStage: true,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    snapshot: "",
    contracts: {
      governor: "0xcB1622185A0c62A80494bEde05Ba95ef29Fbf85c",
      token: "0x0B010000b7624eb9B3DfBC279673C76E9D29D5F7",
      timelock: "0xCdBf527842Ab04Da548d33EB09d03DB831381Fb0",
    },
    cancelFunction:
      "https://etherscan.io/address/0xcb1622185a0c62a80494bede05ba95ef29fbf85c#writeContract#F1",
    govPlatform: {
      name: "Tally",
      url: "https://tally.xyz/gov/obol/proposal/",
    },
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
  },
  governanceImplementation: {
    fields: {
      [GovernanceImplementationEnum.AUDITED_CONTRACTS]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.AUDITED_CONTRACTS
          ].description,
        currentSetting:
          "The governance contracts in Obol have not been audited.",
        impact:
          "Obol's governance contracts have no public audit, making them a potential attack vector for hackers.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.AUDITED_CONTRACTS],
        nextStep:
          "Obol’s governance contracts should be audited, and the audit should be made public.",
        requirements: [
          "Governance contracts must be audited by a reputable third-party security firm and the audit report should be publicly available.",
        ],
      },
      [GovernanceImplementationEnum.INTERFACE_RESILIENCE]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ].description,
        currentSetting:
          "The governance interfaces and domain of the Obol do not have DNS protection, leaving voters vulnerable to spoofing and hijacking attacks.",
        impact:
          "Without protection for its governance domains and interfaces, governance participants may be manipulated into voting for an outcome that harms the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ],
        nextStep:
          "Obol needs to enable DNSSEC and HTTPS on the domains of its governance interfaces, in order to raise its standard to Medium Risk.",
        requirements: [
          "Voting domain must have CAA set up to prevent domain hijacking.",
        ],
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        currentSetting:
          "The DAO does not have control over the treasury. Therefore, there is no risk of capturing it.",
        impact:
          "The DAO does not control the treasury. Therefore, its treasury can't be targeted in an attack.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
        currentSetting:
          "It protects the DAO from a flash loan aimed at reaching the Proposal Threshold and submitting a proposal, by taking a snapshot of the governance power from delegates/holders one block before the proposal submission.",
        impact:
          "It is not possible to use a flash loan to reach the amount required to submit a proposal.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        currentSetting:
          "The Proposal Threshold is set to 30K $OBOL (0.084% Total Supply)",
        impact:
          "The current liquidity of the governance token does not pose a risk to the DAO. Therefore, the Proposal Threshold is sufficient to block proposal spam and discourage attackers.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep:
          "The Proposal Threshold can be increased to a value above 0.5% market supply, in order to raise the cost of submitting proposals in governance and reduce the likelihood of spam.",
        requirements: [
          "Proposal threshold should be at least 1% of the active market supply to provide adequate protection against spam and malicious proposals.",
        ],
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        currentSetting:
          "As of now, Obol Collective functions with a small committee multi-sig (2/3) but intends to develop towards a full Security Council structure. Treasury is not controlled by governance, but malicious proposals may still pose a risk to the protocol and its users.",
        impact:
          "Having an insecure Security Council puts not only the DAO, but the protocol itself at risk. If the 2/3 multisig is compromised, Obol could be attacked, affecting its users.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SECURITY_COUNCIL],
        nextStep:
          "The Security Council should follow L2Beat standards, with a multisig of at least 8 signers and a 75% approval threshold for signatures.",
        requirements: [
          "The Obol Security Council must upgrade its multisig to the highest standard, with at least 8 signers and a 75% approval threshold for transactions.",
        ],
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        currentSetting:
          "There is no limit to the number of proposals that a single address can submit in the DAO.",
        impact:
          "A single address can submit multiple proposals, potentially masking an attack within one of them.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SPAM_RESISTANCE],
        nextStep:
          "It is necessary to limit the number of proposals that can be submitted by a single address.",
        requirements: [
          "Obol has no limit on active proposals or proposals submitted per address. Thus, it is susceptible to spam in its governance.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        currentSetting: "Governor has Admin role on timelock",
        impact:
          "Since the Governor is the administrator of the Timelock, only the DAO can control it - decentralizing its governance.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.TIMELOCK_ADMIN],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        currentSetting:
          "The Timelock execution delay for an approved proposal is 5 days.",
        impact:
          "There is a protected delay between proposal approval and execution.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.TIMELOCK_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        currentSetting:
          "Governor has veto powers over the timelock, providing an additional layer of security against malicious proposals.",
        impact:
          "It is possible to cancel proposals through the Timelock or the Security Council.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VETO_STRATEGY],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        currentSetting:
          "The DAO does not allow changing votes once they have been cast.",
        impact:
          "Governance participants cannot change their votes after casting them. In the event of a governance interface hijack, they may be manipulated into voting for the opposite of their intended choice, enabling an attack on the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTE_MUTABILITY],
        nextStep:
          "Allow voters to change their vote until the Voting Period ends.",
        requirements: [
          "Without the ability to change votes, voters cannot correct mistakes or respond to new information, potentially leading to suboptimal governance outcomes.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        currentSetting: "The Voting Delay is set to 1 day.",
        impact:
          "With a short Voting Delay, delegates and stakeholders have little time to prepare to vote or to protect the DAO from an attack.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep:
          "The Voting Delay needs to be increased to at least 2 days in order to be considered Medium Risk.",
        requirements: [
          "A minimum of 2 days of Voting Delay is required for a DAO to be considered secure in this parameter.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
        currentSetting:
          "It protects the DAO from a flash loan aimed to increase their voting power, by taking a snapshot of the governance power from delegates/holders one block before the Voting Period starts.",
        impact:
          "It is not possible to use a flash loan to increase voting power and approve a proposal.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        currentSetting: "The Voting Period is set to 5 days.",
        impact:
          "The current Voting Period is sufficient for governance participants to cast their votes.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep:
          "The Voting Period should be increased to 7 days in order to be considered Low Risk.",
        requirements: [
          "Voting period should be at least 7 days to allow adequate time for community discussion and participation.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        currentSetting:
          "There is a subsidy to help voters participate in governance voting.",
        impact:
          "By subsidizing governance participants' voting costs, there is greater participation and stronger incentives for delegates to protect the DAO, since they do not incur gas fees to vote.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_SUBSIDY],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
  attackExposure: {
    defenseAreas: {
      [RiskAreaEnum.SPAM_RESISTANCE]: {
        description:
          "A low proposal threshold and unrestricted proposal submissions reduce the cost of flooding governance, while a 5-day voting period limits defensive participation, resulting in high exposure to governance spam.",
      },
      [RiskAreaEnum.ECONOMIC_SECURITY]: {
        description:
          "The treasury is controlled by a multisig, not executed automatically by governance. Since proposals can’t directly move funds, attacks that try to profit by draining the treasury don’t apply.",
      },
      [RiskAreaEnum.SAFEGUARDS]: {
        description:
          "Safeguards rely on a limited committee structure, increasing exposure to malicious actions or governance mistakes.",
      },
      [RiskAreaEnum.CONTRACT_SAFETY]: {
        description:
          "Governance contracts have not been audited, increasing the risk that vulnerabilities in smart contracts or governance processes could be exploited.",
      },
      [RiskAreaEnum.RESPONSE_TIME]: {
        description:
          "A 1-day voting delay and a 5-day voting period limit the time available for coordination and response, increasing the risk of rushed or insufficiently reviewed governance decisions.",
      },
      [RiskAreaEnum.GOV_FRONTEND_RESILIENCE]: {
        description:
          "Interface protections are largely absent, leaving governance interfaces vulnerable to spoofing and hijacking, and immutable votes limit recovery from front-end compromise, resulting in high governance interface risk.",
      },
    },
  },
};
