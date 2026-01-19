import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { CompoundIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";

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
        riskExplanation: "Compound contracts are audited.", //Link: https://www.openzeppelin.com/news/compound-governor-bravo-audit
      },
      [GovernanceImplementationEnum.INTERFACE_HIJACK]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
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
        riskExplanation:
          "Compound has the Proposal Guardian, a multisig responsible for canceling malicious proposals.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
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
        riskExplanation: "Governor has Admin role on timelock.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        riskExplanation: "2 days is a sufficient delay for Timelock.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
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
        riskExplanation:
          "The voting subsidy exists in the Governor code, and is already implemented to voters.", // https://app.compound.finance/extensions/comp_vote
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  riskAnalysis: true,
  dataTables: true,
};
