import { RiskLevel } from "@/shared/types/enums";
import { DaoConfiguration } from "@/shared/dao-config/types";
import { GovernanceImplementationEnum } from "@/shared/types/enums/GovernanceImplementation";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { UniswapIcon } from "@/shared/components/icons";
import { UniswapOgIcon } from "@/shared/og/dao-og-icons";
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
  ogIcon: UniswapOgIcon,
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
      [GovernanceImplementationEnum.INTERFACE_RESILIENCE]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ].description,
        currentSetting:
          "The Uniswap governance interface on tally has a secure HTTPS connection and is signed with DNSSEC.",
        impact:
          "The voting interface used has certificates to guarantee its source of content. It is still vulnerable to malicious/mistakenly pushed code by the third party provider.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ],
        nextStep:
          "The DAO should host an immutable interface for voting, registering it to an ENS like vote.uniswap.eth and made available through .limo, .link or similar.",
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
          "The incentives to capture a DAO with a high delegated cap and no liquid treasury beyond its own token are lower than in other DAOs.",
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
          "The DAO has a sufficiently high proposal threshold to avoid spam proposals and discourage attacks.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep: "The parameter is in its lowest-risk condition.",
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
          "If the proposer sells their tokens and their balance falls below the Proposal Threshold, the proposal can be cancelled by any address.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        currentSetting:
          "There is a limit of one live/pending proposal per address that any address can submit to the DAO.",
        impact:
          "A single address can only have one live proposal at the time, effectively protecting governance from a spam attack.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.SPAM_RESISTANCE],
        nextStep: "The parameter is in its lowest-risk condition.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        riskLevel: RiskLevel.LOW,
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
        nextStep: "The Voting Delay should be at least two days.",
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
          "The current Voting Period is sufficient for governance participants to cast their votes, but the recommended safety is 7 days or more for a low-level risk.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep:
          "The Voting Period should be equal to or greater than 7 days.",
        requirements: [
          "A voting window under seven days risks excluding weekend or time‑zoned delegates, lowering turnout and quorum.",
          "Currently, voting lasts 5 d 6 h (Medium Risk).",
          "Increase the period to ≥ 7 days so all delegates have time to participate.",
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
          "By subsidizing governance participants voting costs, there is greater participation and stronger incentives for delegates to protect the DAO, since they do not incur gas fees to vote.",
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
