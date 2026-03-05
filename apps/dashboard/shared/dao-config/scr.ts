import { scroll } from "viem/chains";

import { ScrollIcon } from "@/shared/components/icons";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { ScrollOgIcon } from "@/shared/og/dao-og-icons";
import {
  RiskLevel,
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";

export const SCR: DaoConfiguration = {
  name: "Scroll",
  decimals: 18,
  color: {
    svgColor: "#ebc28e",
    svgBgColor: "#ffeeda",
  },
  forumLink: "https://governance.scroll.io/",
  icon: ScrollIcon,
  ogIcon: ScrollOgIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...scroll, icon: ScrollIcon, blockTime: 3000 },
    snapshot: "",
    contracts: {
      governor: "0x2f3f2054776bd3c2fc30d750734a8f539bb214f0",
      token: "0xd29687c813D741E2F938F4aC377128810E217b1b",
      timelock: "0x79D83D1518e2eAA64cdc0631df01b06e2762CC14",
    },
    govPlatform: {
      name: "Agora",
      url: "https://gov.scroll.io/proposals/",
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
  },
  governanceImplementation: {
    fields: {
      [GovernanceImplementationEnum.AUDITED_CONTRACTS]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.AUDITED_CONTRACTS
          ].description,
        currentSetting:
          "The Scroll DAO contracts have been audited, and the audit is publicly available.",
        impact:
          "With its governance contracts audited, the risk of vulnerabilities in them is minimized.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.AUDITED_CONTRACTS],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.INTERFACE_RESILIENCE]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ].description,
        currentSetting:
          "The governance interfaces and domain of the Scroll do not have DNS protection, leaving voters vulnerable to spoofing and hijacking attacks.",
        impact:
          "Without protection for its governance domains and interfaces, governance participants may be manipulated into voting for an outcome that harms the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ],
        nextStep:
          "Scroll needs to enable DNSSEC and HTTPS on the domains of its governance interfaces, in order to raise its standard to Medium Risk.",
        requirements: [
          "Without the proper protections(DNSSEC/SPF/DKIM/DMARC), attackers can spoof governance UIs by hijacking unprotected domains.",
          "Secure every DAO‑owned domain with Industry standard and publish a security‑contact record.",
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
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        currentSetting:
          "The Proposal Threshold is set to 50M $SCR (5% Total Supply)",
        impact:
          "The current liquidity of the governance token does not pose a risk to the DAO. Therefore, the Proposal Threshold is sufficient to block proposal spam and discourage attackers.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        currentSetting: "Scroll has a Security Council",
        impact:
          "The Security Council can protect the DAO from malicious proposals by canceling them after the 9/12 multisig approval.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SECURITY_COUNCIL],
        nextStep: "The parameter is in its lowest-risk condition.",
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
          "Scroll has no limit on active proposals or proposals submitted per address. With a low proposal threshold, it is susceptible to spam in its governance.",
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
          "The Timelock execution delay for an approved proposal is 3 days.",
        impact:
          "There is a protected delay between proposal approval and execution.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.TIMELOCK_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        currentSetting:
          "Scroll has the ability to veto proposals through its Security Council and via its Timelock (Governor).",
        impact:
          "Scroll can veto malicious proposals with the Security Council.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VETO_STRATEGY],
        nextStep:
          "Only the DAO should be able to cancel proposals, not an external agent (such as a Security Council appointed by the Foundation).",
        requirements: [
          "Veto strategy should be fully controlled by the DAO in order to have a low risk level.",
        ],
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
          "Without the ability to change votes after they are cast, voters cannot respond to new information or changes in sentiment.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        currentSetting: "The Voting Delay is set to 3 days.",
        impact:
          "Given the current Voting Delay, the DAO has sufficient time to coordinate stakeholders and wallets before the snapshot (that counts votes) occurs.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
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
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        currentSetting: "The Voting Period is set to 7 days.",
        impact:
          "The current Voting Period is sufficient for governance participants to cast their votes.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        currentSetting:
          "There is no subsidy to help voters participate in governance voting.",
        impact:
          "Without subsidies, voters incur costs to participate in governance. During periods of high gas fees, participation may decrease, making the DAO easier to attack.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_SUBSIDY],
        nextStep:
          "Subsidies should be provided to delegates to cover the gas fees for those who participate in governance voting.",
        requirements: [
          "Introduce a voting subsidy mechanism to encourage higher voter turnout and reduce voter attrition in times of need.",
        ],
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
          "Proposal submissions are unrestricted, and voting is not subsidized, reducing defensive response and significantly increasing governance spam risk.",
      },
      [RiskAreaEnum.ECONOMIC_SECURITY]: {
        description:
          "The treasury is controlled by a multisig, not executed automatically by governance. Since proposals can’t directly move funds, attacks that try to profit by draining the treasury don’t apply.",
      },
      [RiskAreaEnum.SAFEGUARDS]: {
        description:
          "Voting is not subsidized, reducing defensive participation and weakening safeguards despite the presence of veto mechanisms.",
      },
      [RiskAreaEnum.CONTRACT_SAFETY]: {
        description: "All metrics in this defense are currently in low risk.",
      },
      [RiskAreaEnum.RESPONSE_TIME]: {
        description: "All metrics in this defense are currently in low risk.",
      },
      [RiskAreaEnum.GOV_FRONTEND_RESILIENCE]: {
        description:
          "Interface protections are largely absent, leaving governance interfaces vulnerable to spoofing and hijacking, and immutable votes limit recovery from front-end compromise, resulting in high governance interface risk.",
      },
    },
  },
};
