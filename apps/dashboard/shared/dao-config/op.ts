import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { OptimismIcon } from "@/shared/components/icons";
import { OptimismOgIcon } from "@/shared/og/dao-og-icons";
import { optimism } from "viem/chains";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { OptimismChainIcon } from "@/shared/components/icons/OptimismChainIcon";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import { RiskAreaEnum } from "@/shared/types/enums/RiskArea";

export const OP: DaoConfiguration = {
  name: "Optimism",
  decimals: 18,
  color: {
    svgColor: "#ff0420",
    svgBgColor: "#FFF2FB",
  },
  forumLink: "https://gov.optimism.io/",
  noStage: true,
  icon: OptimismIcon,
  ogIcon: OptimismOgIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...optimism, icon: OptimismChainIcon },
    snapshot: "https://snapshot.box/#/s:citizenshouse.eth",
    govPlatform: {
      name: "Agora",
      url: "https://vote.optimism.io/proposals/",
    },
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
      quorumCalculation: QUORUM_CALCULATION_TYPES.DELEGATE_SUPPLY,
      proposalThreshold: "Only Foundation Proposes",
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    dynamicQuorum: {
      percentage: 0.3,
    },
  },
  governanceImplementation: {
    // Fields are sorted alphabetically by GovernanceImplementationEnum for readability
    fields: {
      [GovernanceImplementationEnum.AUDITED_CONTRACTS]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.AUDITED_CONTRACTS
          ].description,
        currentSetting:
          "The Optimism DAO contracts have been audited, and the audit is publicly available.",
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
          "The governance interfaces and domain of the Optimism DAO do not have DNS protection, leaving voters vulnerable to spoofing and hijacking attacks.",
        impact:
          "Without protection for its governance domains and interfaces, governance participants may be manipulated into voting for an outcome that harms the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ],
        nextStep:
          "Optimism needs to enable DNSSEC and HTTPS on the domains of its governance interfaces, in order to raise its standard to Medium Risk.",
        requirements: [
          "Without the proper protections(DNSSEC/SPF/DKIM/DMARC), attackers can spoof governance UIs by hijacking unprotected domains.",
          "Currently, the DAO’s domains have no publicly verifiable DNS-level protections (High Risk).",
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
          "The Optimism treasury is not accessible to the DAO; it is controlled only by Foundation-managed multisigs. Therefore, there is no opportunity to profit from an attack on the treasury.",
        impact:
          "The DAO does not control the treasury. Therefore, its treasury can't be targeted in an attack.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
        requirements: [
          "The DAO has no treasury directly controllable by governance, so there is no risk of attack profitability.",
          "The treasury risks in the Collective are related to mistakes or malicious actions by the Foundation.",
        ],
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
        requirements: [
          "The Foundation, as manager of the contract, is the only one that can propose, so there's no risk of proposal flashloan attacks.",
          "The flashloan protection in the contract is commented out, due to the onlyManagerOrTimelock bein used on the propose() function.",
        ],
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        currentSetting:
          "Since only the Foundation can submit proposals, there is no Proposal Threshold.",
        impact:
          "There is no impact from not having a Proposal Threshold, as long as only the Foundation holds this power.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep: "The parameter is in its lowest-risk condition.",
        requirements: [
          "The proposal threshold is 0, but the propose() function is only callable by the manager, which is the Foundation.",
        ],
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        currentSetting:
          "Optimism has a Security Council, elected by the DAO and renewed periodically. It is not responsible for participating in governance decisions, but for performing protocol upgrades.",
        impact:
          "The Security Council can cancel L2 upgrades, protecting the protocol from governance-level attacks.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SECURITY_COUNCIL],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        riskLevel: RiskLevel.LOW,
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
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        currentSetting:
          "There is a Timelock, but it is not used and is controlled by the Foundation.",
        impact: "There is no impact, since the Timelock is not used.",
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
          "The DAO does not have the ability to execute proposals, nor a Timelock to provide a delay between approval and execution.",
        impact:
          "Since Optimism does not have a Timelock connected to its Governor, there is no impact.",
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
          "Since only the Foundation can submit and execute proposals, there is no need for a Veto Strategy.",
        impact:
          "There is no impact from not having a Veto Strategy, as long as only the Foundation has the power to propose and execute proposals.",
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
          "If voters cannot revise their ballots, a last-minute interface exploit or late discovery of malicious code can trap delegates in a choice that now favors an attacker, weakening the DAO’s defense.",
          "The governance contract should let any voter overwrite their previous vote while the voting window is open—ideally through an adapted castVoteWithReasonAndParams call or equivalent.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        currentSetting:
          "The Foundation is the only allower proposer, and it follows a voting schedule, so there's no reason to have a voting delay. ",
        impact:
          "The Optimism voting calendar replaces the Voting Delay, since this structure is fully controlled by the Foundation.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
        requirements: [
          "Voting delay is the time between proposal submission and the snapshot that fixes voting power. The current 0 blocks delay means proposals are live for voting as soon as created by the Foundation.",
          "The DAO should enforce a delay of at least two full days and have an automatic alert plan that notifies major voters the moment a proposal is posted.",
          "The Foundation is the only allowed proposer, and it follows a voting schedule, so there's no reason to have a voting delay.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
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
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        currentSetting: "The Voting Period is set to 6 days",
        impact:
          "The current Voting Period is sufficient for governance participants to cast their votes.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep: "The parameter is in its lowest-risk condition.",
        requirements: [
          "The voting period is 6 days, with the recommended safety being of 7 or more for a low level of risk.",
          "The Foundation is the only allowed proposer, and it follows a voting schedule, reducing the impact of this risk.",
        ],
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
          "The voting subsidy is not applied, requiring delegates to pay gas on the proposals they vote on.",
          "With no voting subsidy, the structure is more vulnerable to spam attacks, as it's more costly for the defense than the attacker",
          "The Foundation is the only allowed proposer, so the risk of spam attacks are low. Still, the DAO should consider applying a voting subsidy to make its structure more resilient.",
        ],
      },
    },
  },
  attackExposure: {
    defenseAreas: {
      [RiskAreaEnum.SPAM_RESISTANCE]: {
        description:
          "Voting is not subsidized, requiring delegates to pay to participate, which can reduce turnout. Combined with a 6-day voting period, this limits visibility and response, increasing governance spam risk.",
      },
      [RiskAreaEnum.ECONOMIC_SECURITY]: {
        description:
          "The treasury is controlled by a multisig, not executed automatically by governance. Since proposals can’t directly move funds, attacks that try to profit by draining the treasury don’t apply.",
      },
      [RiskAreaEnum.SAFEGUARDS]: {
        description:
          "Voting is not subsidized, requiring delegates to pay to participate, which can reduce defensive turnout and weaken governance safeguards during critical proposals.",
      },
      [RiskAreaEnum.CONTRACT_SAFETY]: {
        description: "All metrics in this defense are currently in low risk.",
      },
      [RiskAreaEnum.RESPONSE_TIME]: {
        description:
          "A 6-day voting period provides limited time for coordination and response, resulting in moderate response-time risk.",
      },
      [RiskAreaEnum.GOV_FRONTEND_RESILIENCE]: {
        description:
          "Interface protections are largely absent, leaving governance interfaces vulnerable to spoofing and hijacking, and immutable votes limit recovery from front-end compromise, resulting in high governance interface risk.",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
