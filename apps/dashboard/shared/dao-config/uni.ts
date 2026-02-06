import { RiskLevel } from "@/shared/types/enums";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { GovernanceImplementationEnum } from "@/shared/types/enums/GovernanceImplementation";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { UniswapIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import { RiskAreaEnum } from "@/shared/types/enums/RiskArea";

export const UNI: DaoConfiguration = {
  name: "Uniswap",
  decimals: 18,
  color: {
    svgColor: "#fc72ff",
    svgBgColor: "#FFF2FB",
  },
  forumLink: "https://gov.uniswap.org/",
  icon: UniswapIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    contracts: {
      governor: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
      token: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      timelock: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
    },
    cancelFunction:
      "https://etherscan.io/address/0x1a9C8182C09F50C8318d769245beA52c32BE35BC#writeContract%23F2",
    snapshot: "https://snapshot.box/#/s:uniswapgovernance.eth",
    govPlatform: {
      name: "Tally",
      url: "https://tally.xyz/gov/uniswap/proposal/",
    },
    rules: {
      delay: true,
      changeVote: true,
      timelock: true,
      cancelFunction: true,
      logic: "For",
      quorumCalculation: QUORUM_CALCULATION_TYPES.TOTAL_SUPPLY,
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
          "The Uniswap DAO contracts have been audited, and the audit is publicly available.",
        impact:
          "With its governance contracts audited, the risk of vulnerabilities in them is minimized.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.AUDITED_CONTRACTS],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.INTERFACE_HIJACK]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
        currentSetting:
          "The Uniswap governance interface has a secure HTTPS connection and is signed with DNSSEC.",
        impact:
          "The governance interface domain cannot be hijacked, but without IPFS it is not censorship-resistant or fully on-chain.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.INTERFACE_HIJACK],
        nextStep:
          "The Uniswap governance interface domain should be hosted on IPFS.",
        requirements: [
          "For maximum security, the DAO should have its frontend reviewed by the DAO or audit and then made verifiably immutable",
          "A solution could look like a frontend made available on IPFS through eth.limo, with their code hashed and put on chain by the DAO, then verified for subresource integrity",
          "The governance interface used (Tally) has the standard protections to prevent external tampering with the frontend accessed",
          "The platform is still exposed to any malicious or compromised actors inside the interface provider team",
        ],
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        currentSetting:
          "The extractable value of the Uniswap DAO is less than $10K, since its treasury consists only of governance tokens and has no liquid assets.",
        impact:
          "The incentives to capture a DAO with a high delegated cap and no liquid treasury are lower than in other DAOs.",
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
          "The Proposal Threshold is set to 1M $UNI (0,1% Total Supply)",
        impact:
          "The current liquidity of the governance token does not pose a risk to the DAO. Therefore, the Proposal Threshold is sufficient to block proposal spam and discourage attackers.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
        currentSetting:
          "Uniswap has a cancellation mechanism: if the proposer sells their tokens and their balance falls below the Proposal Threshold, the proposal is automatically canceled.",
        impact:
          "Threshold-based cancellation protects against malicious proposals by allowing cancellation if proposer stake drops.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ],
        nextStep:
          "Continue maintaining threshold-based cancellation mechanism.",
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ].description,
        currentSetting:
          "Uniswap has a cancellation mechanism: if the proposer sells their tokens and their balance falls below the Proposal Threshold, the proposal is automatically canceled.",
        impact:
          "If the proposer sells their tokens and their balance falls below the Proposal Threshold, the proposal is automatically canceled.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        currentSetting: "The Uniswap DAO has a Security Council.",
        impact:
          "Without a Security Council, there is no protection mechanism against malicious proposals.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SECURITY_COUNCIL],
        nextStep: "-",
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
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        currentSetting:
          "Uniswap don't have a cancel function activated or a Security Council to stop malicious proposals. ",
        impact:
          "Without a veto strategy, a malicious proposal can be approved.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VETO_STRATEGY],
        nextStep: "-",
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
          "If ballots can’t be changed, a late‑discovered UI exploit or code bug can trap delegates in a now‑malicious vote, weakening defenses.",
          "Currently, votes become immutable once cast (Medium Risk).",
          "Upgrade governance so any voter can overwrite their vote until the voting window closes (e.g. via castVoteWithReasonAndParams).",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        currentSetting: "The Voting Delay is set to 1 day and 19 hours",
        impact:
          "Given the current Voting Delay, the DAO has sufficient time to coordinate stakeholders and wallets before the snapshot (that counts votes) occurs.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep: "The parameter is in its lowest-risk condition.",
        requirements: [
          "A short window between proposal submission and the voting snapshot lets attackers rush malicious items through before delegates mobilize.",
          "Currently, the delay is 44 h (Medium Risk).",
          "Enforce a delay of ≥ 48 h and deploy an automatic delegate‑alert system when a proposal is queued.",
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
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        currentSetting: "The Voting Period is set to 5 day and 6 hours",
        impact:
          "The current Voting Period is sufficient for governance participants to cast their votes.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep: "The parameter is in its lowest-risk condition.",
        requirements: [
          "A voting window under seven days risks excluding weekend or time‑zoned delegates, lowering turnout and quorum.",
          "Currently, voting lasts 5 d 6 h (Medium Risk).",
          "Increase the period to ≥ 7 days so all delegates have time to participate.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        riskLevel: RiskLevel.MEDIUM,
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
        nextStep: "The parameter is in its lowest-risk condition.",
      },
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    supportsLiquidTreasuryCall: true,
  },
  attackExposure: {
    defenseAreas: {
      [RiskAreaEnum.SPAM_RESISTANCE]: {
        description:
          "Voting period is below the ideal length, moderately reducing resistance to sustained proposal spam.",
      },
      [RiskAreaEnum.ECONOMIC_SECURITY]: {
        description: "All metrics in this defense are currently in low risk.",
      },
      [RiskAreaEnum.SAFEGUARDS]: {
        description: "All metrics in this defense are currently in low risk.",
      },
      [RiskAreaEnum.CONTRACT_SAFETY]: {
        description: "All metrics in this defense are currently in low risk.",
      },
      [RiskAreaEnum.RESPONSE_TIME]: {
        description:
          "Response time is partially limited by shorter-than-ideal voting delay and voting period, reducing the window for coordinated reaction and review.",
      },
      [RiskAreaEnum.GOV_FRONTEND_RESILIENCE]: {
        description:
          "Interface protections are present but not fully hardened, and immutable votes limit recovery in the event of front-end compromise, resulting in moderate governance interface risk.",
      },
    },
  },
  tokenDistribution: true,
  resilienceStages: true,
  dataTables: true,
};
