import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { CompoundIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import { RiskAreaEnum } from "@/shared/types/enums/RiskArea";

export const COMP: DaoConfiguration = {
  name: "Compound",
  decimals: 18,
  color: {
    svgColor: "#070A0E",
    svgBgColor: "#00D395",
  },
  icon: CompoundIcon,

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
        value: "Yes",
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
        riskExplanation: "Compound contracts are audited.", //Link: https://www.openzeppelin.com/news/compound-governor-bravo-audit
      },
      [GovernanceImplementationEnum.INTERFACE_HIJACK]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
        currentSetting:
          "The domain is not signed with a valid signature (DNSSEC) and it is not possible to establish a secure connection to it (HTTPS).",
        impact:
          "Without protection for its governance domains and interfaces, governance participants may be manipulated into voting for an outcome that harms the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.INTERFACE_HIJACK],
        nextStep:
          "Nouns needs to enable DNSSEC and HTTPS on the domains of its governance interfaces, in order to raise its standard to Medium Risk.",
        requirements: [
          "Without the proper protections(DNSSEC/SPF/DKIM/DMARC), attackers can spoof governance UIs by hijacking unprotected domains.", // https://internet.nl/site/www.tally.xyz/3493806/
        ],
        riskExplanation:
          "The domain is not signed with a valid signature (DNSSEC) and it is not possible to establish a secure connection to it (HTTPS).",
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        value: "U$2.72B",
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
        riskExplanation:
          "If Compound gets captured, the entire TVL of the protocol could be stolen — including users’ funds.",
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
        value: "25K $COMP",
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
        riskExplanation:
          "The proposal threshold is 0,9% of the market supply, which is considered medium risk.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "Yes",
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
        riskExplanation:
          "If the proposer maintains governance power above the Proposal Threshold during the Voting Period, the proposal will be canceled",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "Yes",
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
        riskExplanation:
          "Compound has the Proposal Guardian, a multisig responsible for canceling malicious proposals.",
        impact:
          "The Security Council can protect the DAO from malicious proposals by canceling them after the 4/8 multisig approval.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SECURITY_COUNCIL],
        nextStep:
          "Follow L2Beat's standards to have a more secure Security Council.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
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
        riskExplanation: "Compound governance is vulnerable to spam.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "Yes",
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
        riskExplanation: "Governor has Admin role on timelock.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        currentSetting: "The Voting Period is set to 2 days",
        impact:
          "There is a protected delay between proposal approval and execution.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.TIMELOCK_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
        riskExplanation: "2 days is a sufficient delay for Timelock.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
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
        riskExplanation:
          "There is a veto strategy controlled by the Compound DAO.",
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
          "It is necessary to allow voters to change their votes until the end of the proposal to prevent them from being misled in an attack on Compound's governance DNS.",
        ],
        riskExplanation:
          "The lack of vote mutability jeopardizes DAO decisions if its main voting interface is attacked.",
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "1 day and 19 hours",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        currentSetting: "The Voting Period is set to 1 day and 19 hours",
        impact:
          "The Voting Delay period can be longer. This gives delegates and stakeholders little time to coordinate their votes and for the DAO to protect itself against an attack. This poses a governance risk.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep: "The Voting Delay should be at least two days.",
        requirements: [
          "The Voting Delay needs to be more than 2 days for be considered as Medium Risk.",
        ],
        riskExplanation:
          "With the current Voting Delay, Compound has little time left to gather votes to protect its governance, in case of an attack.",
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes",
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
        riskExplanation:
          "Voting power are based on block previous to when voters could first cast a vote, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "2 days and 17 hours",
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
        nextStep: "The Voting Period should be at least two days.",
        requirements: [
          "The Voting Period must have, at least, 3 days to be classified as Medium Risk.",
        ],
        riskExplanation:
          "Compound has a short timeframe to prepare itself in case of a governance attack.",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "Yes",
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
        riskExplanation:
          "The voting subsidy exists in the Governor code, and is already implemented to voters.", // https://app.compound.finance/extensions/comp_vote
      },
    },
  },
  attackExposure: {
    defenseAreas: {
      [RiskAreaEnum.SPAM_RESISTANCE]: {
        description: "To be defined",
      },
      [RiskAreaEnum.ECONOMIC_SECURITY]: {
        description: "To be defined",
      },
      [RiskAreaEnum.SAFEGUARDS]: {
        description: "To be defined",
      },
      [RiskAreaEnum.CONTRACT_SAFETY]: {
        description: "To be defined",
      },
      [RiskAreaEnum.RESPONSE_TIME]: {
        description: "To be defined",
      },
      [RiskAreaEnum.GOV_FRONTEND_RESILIENCE]: {
        description: "To be defined",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  dataTables: true,
};
