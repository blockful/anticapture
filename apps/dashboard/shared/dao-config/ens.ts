import { mainnet } from "viem/chains";

import { EnsIcon } from "@/shared/components/icons";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { EnsOgIcon } from "@/shared/og/dao-og-icons";
import {
  RiskLevel,
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";
import { calculateMonthsBefore } from "@/shared/utils";

export const ENS: DaoConfiguration = {
  name: "ENS",
  decimals: 18,
  color: {
    svgColor: "#0080bc",
    svgBgColor: "#fff",
  },
  forumLink: "https://discuss.ens.domains/",
  icon: EnsIcon,
  ogIcon: EnsOgIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    snapshot: "https://snapshot.box/#/s:ens.eth",
    contracts: {
      governor: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
      token: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
      timelock: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
    },
    cancelFunction: undefined,
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: false,
      logic: "For + Abstain",
      quorumCalculation: QUORUM_CALCULATION_TYPES.TOTAL_SUPPLY,
    },
    govPlatform: {
      name: "Anticapture",
      url: "https://anticapture.com/ens/governance/proposal/",
    },
    securityCouncil: {
      isActive: true,
      vetoCouncilAddress: "0x552DF471a4c7Fea11Ea8d7a7b0Acc6989b902a95",
      multisig: {
        threshold: 4,
        signers: 8,
        externalLink:
          "https://app.safe.global/home?safe=eth:0xaA5cD05f6B62C3af58AE9c4F3F7A2aCC2Cdc2Cc7",
      },
      expiration: {
        startDate: "July 1, 2024",
        date: "July 26 2026",
        timestamp: 1784919179,
        alertExpiration: calculateMonthsBefore({
          monthsBeforeTimestamp: 3,
          timestamp: 1784919179,
        }),
      },
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.HIGH,
    supportsLiquidTreasuryCall: true,
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
          "The ENS DAO contracts have been audited, and the audit is publicly available.",
        impact:
          "With its governance contracts audited, the risk of vulnerabilities in them is minimized.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.AUDITED_CONTRACTS],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.INTERFACE_RESILIENCE]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ].description,
        currentSetting:
          "The ENS governance interface has a secure HTTPS connection and is signed with DNSSEC.",
        impact:
          "The governance interface domain shows the basic security certificates, but without immutable decentralized storage it is not censorship-resistant or verifiable.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ],
        nextStep:
          "The ENS governance interface domain should be hosted on IPFS.",
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        currentSetting:
          "Because ENS has a large liquid treasury (over $100M), attacking the DAO would be highly profitable. In this case, the Veto Strategy/Security Council is necessary.",
        impact:
          "An attacker has fewer incentives to capture the DAO given the difference between liquid assets and treasury size, and attacker has financial incentives to takeover governance power.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ],
        nextStep:
          "The Delegated Cap should increase, incentivizing delegation to ENS delegates. This raises the cost of attacking the DAO and reduces the potential profitability of an attack.",
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
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        currentSetting:
          "The Proposal Threshold is set to 100K $ENS (0,1% Total Supply)",
        impact:
          "ENS has a proposal threshold that makes it harder for attackers to be able to create proposals without reaching a significant level of accumulation first.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep:
          "The Proposal Threshold can be increased to a value above 1% market supply, in order to raise the cost of submitting proposals in governance and reduce the likelihood of spam.",
        requirements: [
          "A low proposal threshold lets attackers or small coalitions submit governance actions too easily, forcing the DAO to vote on spam or malicious items.",
          "The DAO should set the proposal threshold at ≥ 1 % of circulating market supply (CEX + DEX + lending pools) so that only wallets with meaningful economic stake can create proposals.",
        ],
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ].description,
        currentSetting:
          "There is no ability to cancel a proposal if the proposer's balance falls below the Proposal Threshold after submitting it.",
        impact:
          "An attacker can buy tokens to submit a proposal in the DAO, vote with them, and sell them during the voting period. There is nothing in ENS governance that protects against this or prevents the attacker from doing so.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ],
        nextStep:
          "The governance contract should allow for permissionless cancel of a proposal if the address that submitted it has a governance token balance below the Proposal Threshold.",
        requirements: [
          "Once a proposal is submitted, the proposer can immediately dump their tokens, reducing their financial risk in case of an attack.",
          "The DAO must enforce a permissionless way to cancel any live proposal if the proposer's voting power drops below the proposal-creation threshold.",
        ],
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        currentSetting:
          "ENS has a Security Council, managed by a 4/8 multisig, whose authority to cancel proposals must be renewed every two years (and will expire in July 2026).",
        impact: "ENS can veto malicious proposals with the Security Council",
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
          "A single address can submit multiple proposals, potentially masking an attack within one of them or make multiple malicious proposals.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SPAM_RESISTANCE],
        nextStep:
          "It is necessary to limit the number of proposals that can be submitted by a single address.",
        requirements: [
          "An attacker can swamp the system with simultaneous proposals, overwhelming voters to approve an attack through a war of attrition",
          "The DAO should impose—and automatically enforce—a hard cap on the number of active proposals any single address can have at once.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        currentSetting: "Governor is the only Admin role on timelock.",
        impact:
          "Since the Governor is the only administrator of the Timelock, only the DAO can control it - decentralizing its governance.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.TIMELOCK_ADMIN],
        nextStep: "The parameter is in its lowest-risk condition.",
        requirements: [
          "The timelock admin can control execution, canceling, upgrades or critical parameter changes; if this power sits outside audited, DAO-approved contracts, attackers or insiders can sidestep on-chain voting.",
          "Admin rights should rest only with DAO governance plus contracts it explicitly approves after a public audit.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        currentSetting:
          "The Timelock execution delay for an approved proposal is 2 days.",
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
          "ENS has a Security Council that is able to veto malicious proposals.",
        impact: "ENS can veto malicious proposals with the Security Council",
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
          "Governance participants cannot change their votes after casting them. In the event of an interface hijack on the voting platform to support the attack, voters cannot revert their vote.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTE_MUTABILITY],
        nextStep:
          "Allow voters to change their vote until the Voting Period ends.",
        requirements: [
          "If voters cannot revise their ballots, a last-minute interface exploit or late discovery of malicious code can trap delegates in a choice that now favors an attacker, weakening the DAO’s defense.",
          "The governance contract should let any voter overwrite their previous vote while the voting window is open—ideally through a single castVoteWithReasonAndParams call or equivalent.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        currentSetting: "The Voting Delay is set to 12 seconds.",
        impact:
          "The Voting Delay period is extremely short. This gives delegates and stakeholders little time to coordinate their votes and for the DAO to protect itself against an attack. This poses a governance risk.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep:
          "The Voting Delay needs to be increased to at least 2 days in order to be considered Medium Risk.",
        requirements: [
          "Voting delay is the time between proposal submission and the snapshot that fixes voting power. The current one-block delay lets attackers rush proposals before token-holders or delegates can react.",
          "The DAO should enforce a delay of at least two full days and have an automatic alert plan that notifies major voters the moment a proposal is posted.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
        currentSetting:
          "It protects the DAO from a flash loan aimed to increase their voting power, by taking a snapshot of the governance power from delegates/holders one block before the Voting Period starts",
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
        currentSetting: "The Voting Period is set to 5d 14h 24min.",
        impact:
          "The current Voting Period is sufficient for governance participants to cast their votes.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep: "The parameter is in its lowest-risk condition.",
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
  attackExposure: {
    defenseAreas: {
      [RiskAreaEnum.SPAM_RESISTANCE]: {
        description:
          "Proposal threshold is below the ideal level and proposal submissions are unrestricted, significantly reducing resistance to sustained proposal spam.",
      },
      [RiskAreaEnum.ECONOMIC_SECURITY]: {
        description:
          "A large treasury held in non-native assets increases attack profitability, requiring additional veto or council mechanisms to keep economic risk at moderate levels.",
      },
      [RiskAreaEnum.SAFEGUARDS]: {
        description:
          "Proposals cannot be cancelled when the proposer's balance drops below the threshold, enabling spam, governance distraction, and low-cost attack experimentation.",
      },
      [RiskAreaEnum.CONTRACT_SAFETY]: {
        description: "All metrics in this defense are currently in low risk.",
      },
      [RiskAreaEnum.RESPONSE_TIME]: {
        description:
          "An extremely short voting delay leaves little time for review or coordination, increasing the risk of rushed or unchallenged governance decisions.",
      },
      [RiskAreaEnum.GOV_FRONTEND_RESILIENCE]: {
        description:
          "Interface protections are present but not fully hardened, and immutable votes limit recovery from front-end compromise, resulting in moderate governance interface risk.",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
  governancePage: true,
};
