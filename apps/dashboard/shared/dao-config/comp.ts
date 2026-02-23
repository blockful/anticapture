import { mainnet } from "viem/chains";

import { CompoundIcon } from "@/shared/components/icons";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { CompoundOgIcon } from "@/shared/og/dao-og-icons";
import {
  RiskLevel,
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";

export const COMP: DaoConfiguration = {
  name: "Compound",
  decimals: 18,
  color: {
    svgColor: "#070A0E",
    svgBgColor: "#00D395",
  },
  icon: CompoundIcon,
  ogIcon: CompoundOgIcon,

  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    snapshot: "https://snapshot.box/#/s:comp-vote.eth/proposals",
    contracts: {
      governor: "0x309a862bbC1A00e45506cB8A802D1ff10004c8C0",
      token: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
      timelock: "0x6d903f6003cca6255D85CcA4D3B5E5146dC33925",
    },
    govPlatform: {
      name: "Tally",
      url: "https://tally.xyz/gov/compound/proposal/",
    },
    cancelFunction:
      "https://etherscan.io/address/0x6d903f6003cca6255D85CcA4D3B5E5146dC33925#writeContract#F5",
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: true,
      logic: "For",
      quorumCalculation: QUORUM_CALCULATION_TYPES.COMPOUND,
      proposalThreshold: "25K $COMP",
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
          "Compound contracts have been audited, and the audit is publicly available.",
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
          "The domain is not signed with a valid signature (DNSSEC) and it is not possible to establish a secure connection to it (HTTPS).",
        impact:
          "Without protection for its governance domains and interfaces, governance participants may be manipulated into voting for an outcome that harms the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ],
        nextStep:
          "Nouns needs to enable DNSSEC and HTTPS on the domains of its governance interfaces, in order to raise its standard to Medium Risk.",
        requirements: [
          "Without the proper protections(DNSSEC/SPF/DKIM/DMARC), attackers can spoof governance UIs by hijacking unprotected domains.", // https://internet.nl/site/www.tally.xyz/3493806/
        ],
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        currentSetting:
          "If Compound gets captured, the entire TVL of the protocol could be stolen — including users' funds.",
        impact: "$2.7B could be stolen from Compound, including user funds.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ],
        nextStep:
          "Reduce the capital at risk controlled by the DAO (Comets), or increase the Delegated Cap and Average Turnout of Compound governance.",
        requirements: [
          "An attack on Compound doesn’t just put its treasury at risk — it also endangers users’ funds. The Governor can authorize a malicious address to move money across all its markets, whether in v2 or v3.",
          "To reduce the profitability of an attack, Compound needs to remove that permission from the Governor.",
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
      },

      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        currentSetting:
          "The proposal threshold is 0,9% of the market supply, which is considered medium risk.",
        impact:
          "$COMP has higher liquidity, making it easier for a large attacker to reach the Proposal Threshold and submit a proposal.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep:
          "The Proposal Threshold should be at least 0.5% of the governance token's market supply.",
        requirements: [
          "The proposal threshold should be increased based on the amount of $COMP market supply.",
        ],
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        requirements: [
          "The Compound Security Council needs to raise the threshold to 75% for approvals on their multisig to be considered Low Risk.",
        ],
        currentSetting:
          "Compound has the Proposal Guardian, a multisig responsible for canceling malicious proposals.",
        impact:
          "The Security Council can protect the DAO from malicious proposals by canceling them after the 4/8 multisig approval.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SECURITY_COUNCIL],
        nextStep:
          "Follow L2Beat's standards to have a more secure Security Council.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        currentSetting: "Compound governance is vulnerable to spam.",
        impact:
          "A single address can submit multiple proposals, potentially masking an attack within one of them.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SPAM_RESISTANCE],
        nextStep:
          "It is necessary to limit the number of proposals that can be submitted by a single address.",
        requirements: [
          "Compound has no limit on active proposals or proposals submitted per address.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        currentSetting: "Timelock is controlled by the Governor.",
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
        currentSetting: "The Timelock Delay is set to 2 days",
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
          "There is a veto strategy controlled by the Compound DAO.",
        impact:
          "Compound can veto malicious proposals with the Security Council",
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
          "It is necessary to allow voters to change their votes until the end of the proposal to prevent them from being misled in an attack on Compound's governance DNS.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        currentSetting: "The Voting Delay is set to 1 day and 19 hours",
        impact:
          "The Voting Delay period can be longer. This gives delegates and stakeholders little time to coordinate their votes and for the DAO to protect itself against an attack. This poses a governance risk.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep: "The Voting Delay should be at least two days.",
        requirements: [
          "The Voting Delay needs to be more than 2 days for be considered as Medium Risk.",
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
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        currentSetting: "The Voting Period is set to 2 days and 17 hours",
        impact:
          "The Voting Period can be longer. A short voting period makes it harder for stakeholders to coordinate and vote against a malicious proposal submitted to the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep:
          "The Voting Period should be equal to or greater than 7 days.",
        requirements: [
          "The Voting Period must have, at least, 3 days to be classified as Medium Risk.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        currentSetting:
          "Voting subsidy exists in the Governor code, and is already implemented to voters.",
        impact:
          "By subsidizing governance participants' voting costs, there is greater participation and stronger incentives for delegates to protect the DAO, since they do not incur gas fees to vote.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_SUBSIDY],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ].description,
        currentSetting:
          "There is no ability to cancel a proposal if the proposer’s balance falls below the Proposal Threshold after submitting it.",
        impact:
          "An attacker can buy tokens to submit a proposal in the DAO, vote with them, and sell during the voting period. There is nothing in Compound governance that protects against this or prevents the attacker from doing so.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
    },
  },
  attackExposure: {
    defenseAreas: {
      [RiskAreaEnum.SPAM_RESISTANCE]: {
        description:
          "A moderate proposal threshold combined with governance vulnerability to spam reduces the cost of flooding the system, while a short 2-day and 17-hour voting period limits reaction time, resulting in high exposure to governance spam.",
      },
      [RiskAreaEnum.ECONOMIC_SECURITY]: {
        description:
          "If Compound governance is captured, the protocol’s entire TVL — including users’ deposited funds — could be at risk. The high potential financial upside makes governance attacks economically attractive.",
      },
      [RiskAreaEnum.SAFEGUARDS]: {
        description:
          "A Proposal Guardian multisig exists and can cancel malicious proposals, providing a layer of protection. However, this safeguard is limited in scope and introduces moderate centralization risk.",
      },
      [RiskAreaEnum.CONTRACT_SAFETY]: {
        description: "All metrics in this defense are currently in low risk.",
      },
      [RiskAreaEnum.RESPONSE_TIME]: {
        description:
          "A 1-day and 19-hour voting delay combined with a 2-day and 17-hour voting period limits the time available for coordination and defensive action, increasing the risk of rushed or insufficiently defended governance decisions.",
      },
      [RiskAreaEnum.GOV_FRONTEND_RESILIENCE]: {
        description:
          "Interface protections are absent or not properly hardened, and immutable votes limit recovery in the event of front-end compromise, resulting in high governance interface risk.",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
