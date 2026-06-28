import { mainnet } from "viem/chains";

import { TornadoCashIcon } from "@/shared/components/icons";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import { TornadoCashOgIcon } from "@/shared/og/dao-og-icons";
import {
  RiskLevel,
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";

export const TORN: DaoConfiguration = {
  name: "Tornado Cash",
  decimals: 18,
  color: {
    svgColor: "#94FEBF",
    svgBgColor: "#1a1a2e",
  },
  icon: TornadoCashIcon,
  ogIcon: TornadoCashOgIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    contracts: {
      governor: "0x5efda50f22d34F262c29268506C5Fa42cB56A1Ce",
      token: "0x77777FeDdddFfC19Ff86DB637967013e6C6A116C",
    },
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: false,
      logic: "For",
      quorumCalculation: "Fixed at 100,000 TORN",
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.MEDIUM,
    supportsLiquidTreasuryCall: true,
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
          "The Tornado Cash DAO contracts have been audited, and the audit is publicly available.",
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
          "The Tornado Cash governance interface follows web2 standard protections with a secure HTTPS connection.",
        impact:
          "The governance interface domain shows basic security certificates, but without immutable decentralized storage it is not censorship-resistant or verifiable.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ],
        nextStep:
          "The Tornado Cash governance interface should be hosted on IPFS for censorship resistance.",
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        currentSetting:
          "Tornado Cash has a treasury managed by the DAO. The cost to accumulate governance power is moderate relative to treasury holdings.",
        impact:
          "A treasury creates financial incentives for an attacker to take over governance power, despite the cost required to accumulate sufficient voting weight.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ],
        nextStep:
          "Increasing delegation participation raises the cost of attacking the DAO and reduces the potential profitability of an attack.",
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
        currentSetting: "The Proposal Threshold is set to 25,000 TORN.",
        impact:
          "Tornado Cash has a proposal threshold that adds a cost barrier to submitting proposals, but it may not be high enough relative to circulating supply to fully deter spam.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep:
          "The Proposal Threshold can be increased to a value above 1% of market supply to raise the cost of submitting proposals and reduce the likelihood of spam.",
        requirements: [
          "A low proposal threshold lets attackers or small coalitions submit governance actions too easily, forcing the DAO to vote on spam or malicious items.",
          "The DAO should set the proposal threshold at a level where only wallets with meaningful economic stake can create proposals.",
        ],
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ].description,
        currentSetting:
          "Proposals cannot be canceled. There is no cancel function available in the Tornado Cash governance contract.",
        impact:
          "An attacker can buy tokens to submit a proposal in the DAO, vote with them, and sell them during the voting period. There is nothing in Tornado Cash governance that protects against this or prevents the attacker from doing so.",
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
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        currentSetting:
          "Tornado Cash does not have a Security Council or multisig with the authority to veto malicious proposals.",
        impact:
          "Without a Security Council, there is no backstop to prevent malicious proposals from being executed once they pass a governance vote.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SECURITY_COUNCIL],
        nextStep:
          "A Security Council should be established with the authority to veto malicious proposals.",
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
          "An attacker can swamp the system with simultaneous proposals, overwhelming voters to approve an attack through a war of attrition.",
          "The DAO should impose—and automatically enforce—a hard cap on the number of active proposals any single address can have at once.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        currentSetting:
          "The execution delay for an approved proposal is 2 days (built into the governor contract).",
        impact:
          "There is a protected delay between proposal approval and execution.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.TIMELOCK_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        currentSetting:
          "Tornado Cash does not have a veto strategy or Security Council capable of blocking malicious proposals.",
        impact:
          "Without a veto mechanism, the DAO has no last line of defense against malicious proposals that manage to pass a governance vote.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VETO_STRATEGY],
        nextStep:
          "A veto mechanism or Security Council should be established to protect against malicious proposals.",
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
          "If voters cannot revise their ballots, a last-minute interface exploit or late discovery of malicious code can trap delegates in a choice that now favors an attacker, weakening the DAO's defense.",
          "The governance contract should let any voter overwrite their previous vote while the voting window is open.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        currentSetting:
          "The Voting Delay is set to approximately 1 block (~12 seconds).",
        impact:
          "The Voting Delay period is extremely short. This gives delegates and stakeholders little time to coordinate their votes and for the DAO to protect itself against an attack. This poses a critical governance risk.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep:
          "The Voting Delay needs to be increased to at least 2 days in order to be considered Medium Risk.",
        requirements: [
          "Voting delay is the time between proposal submission and the snapshot that fixes voting power. The current near-zero delay lets attackers rush proposals before token-holders or delegates can react.",
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
        currentSetting: "The Voting Period is set to approximately 5 days.",
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
          "Without subsidizing governance participants' voting costs, there is lower participation and weaker incentives for delegates to protect the DAO, since they must incur gas fees to vote.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_SUBSIDY],
        nextStep:
          "A voting subsidy should be implemented to lower the barrier to participation in on-chain proposals.",
        requirements: [
          "Without gas subsidies, smaller delegates face economic barriers to voting, reducing turnout and making it easier for well-funded attackers to dominate governance.",
          "The DAO should provide gas-free voting to ensure broad participation.",
        ],
      },
    },
  },
  attackExposure: {
    defenseAreas: {
      [RiskAreaEnum.SPAM_RESISTANCE]: {
        description:
          "Proposal submissions are unrestricted and there is no voting subsidy, significantly reducing resistance to sustained proposal spam and lowering defensive participation.",
      },
      [RiskAreaEnum.ECONOMIC_SECURITY]: {
        description:
          "The treasury managed by the DAO creates financial incentives for attack. Without a Security Council or veto mechanism, economic risk is elevated.",
      },
      [RiskAreaEnum.SAFEGUARDS]: {
        description:
          "Proposals cannot be canceled at all in Tornado Cash governance, and there is no Security Council or veto strategy to block malicious proposals.",
      },
      [RiskAreaEnum.CONTRACT_SAFETY]: {
        description:
          "Audited contracts and flash loan protections provide a solid foundation for contract safety.",
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
