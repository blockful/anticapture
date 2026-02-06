import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { ScrollIcon } from "@/shared/components/icons";
import { scroll } from "viem/chains";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import { RiskAreaEnum } from "@/shared/types/enums/RiskArea";

export const SCR: DaoConfiguration = {
  name: "Scroll",
  decimals: 18,
  color: {
    svgColor: "#ebc28e",
    svgBgColor: "#ffeeda",
  },
  forumLink: "https://governance.scroll.io/",
  icon: ScrollIcon,
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
        value: "Yes",
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
        riskExplanation: "Governance contracts are audited.",
      },
      [GovernanceImplementationEnum.INTERFACE_HIJACK]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
        currentSetting:
          "The governance interfaces and domain of the Scroll do not have DNS protection, leaving voters vulnerable to spoofing and hijacking attacks.",
        impact:
          "Without protection for its governance domains and interfaces, governance participants may be manipulated into voting for an outcome that harms the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.INTERFACE_HIJACK],
        nextStep:
          "Scroll needs to enable DNSSEC and HTTPS on the domains of its governance interfaces, in order to raise its standard to Medium Risk.",
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
        currentSetting:
          "The DAO does not have control over the treasury. Therefore, there is no risk of capturing it.",
        impact:
          "The DAO does not control the treasury. Therefore, its treasury can't be targeted in an attack.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
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
        currentSetting:
          "It protects the DAO from a flash loan aimed at reaching the Proposal Threshold and submitting a proposal, by taking a snapshot of the governance power from delegates/holders one block before the proposal submission.",
        impact:
          "It is not possible to use a flash loan to reach the amount required to submit a proposal.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
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
        currentSetting:
          "The Proposal Threshold is set to 50M $UNI (5% Total Supply)",
        impact:
          "The current liquidity of the governance token does not pose a risk to the DAO. Therefore, the Proposal Threshold is sufficient to block proposal spam and discourage attackers.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep: "The parameter is in its lowest-risk condition.",
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
        currentSetting:
          "There is no ability to cancel a proposal if the proposer's balance falls below the Proposal Threshold after submitting it.",
        impact:
          "An attacker can buy tokens to submit a proposal in the DAO, vote with them, and sell them during the voting period. There is nothing in ENS governance that protects against this or prevents the attacker from doing so.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ],
        nextStep:
          "The governance contract should cancel a proposal if the address that submitted it has a governance token balance below the Proposal Threshold.",
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
        currentSetting: "Scroll has a Security Council",
        impact:
          "The Security Council can protect the DAO from malicious proposals by canceling them after the 9/12 multisig approval.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SECURITY_COUNCIL],
        nextStep: "The parameter is in its lowest-risk condition.",
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
        riskExplanation: "Scroll governance is vulnerable to spam proposals.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "Yes",
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
        currentSetting:
          "The Timelock execution delay for an approved proposal is 3 days.",
        impact:
          "There is a protected delay between proposal approval and execution.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.TIMELOCK_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
        riskExplanation: "The timelock delay is higher than 1 day.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        currentSetting:
          "Scroll has the ability to veto proposals through its Security Council and via its Timelock (Governor).",
        impact: "Scroll can veto malicious proposals with the Security Council",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VETO_STRATEGY],
        nextStep:
          "Only the DAO should be able to cancel proposals, not an external agent (such as a Security Council appointed by the Foundation).",
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
        currentSetting: "The Voting Delay is set to 3 days.",
        impact:
          "Given the current Voting Delay, the DAO has sufficient time to coordinate stakeholders and wallets before the snapshot (that counts votes) occurs.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
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
        currentSetting:
          "It protects the DAO from a flash loan aimed to increase their voting power, by taking a snapshot of the governance power from delegates/holders one block before the Voting Period sarts",
        impact:
          "It is not possible to use a flash loan to increase voting power and approve a proposal.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
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
        currentSetting: "The Voting Period is set to 7 days.",
        impact:
          "The current Voting Period is sufficient for governance participants to cast their votes.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep: "The parameter is in its lowest-risk condition.",
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
        riskExplanation:
          "The voting subsidy is not applied, requiring voters to pay gas on the proposals they vote on.",
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
          "Economic security data is not yet available. Our team is actively working to integrate it.",
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
