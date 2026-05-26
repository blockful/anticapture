import { mainnet } from "viem/chains";

import { ShutterIcon } from "@/shared/components/icons/ShutterIcon";
import { MainnetIcon } from "@/shared/components/icons/MainnetIcon";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { QUORUM_CALCULATION_TYPES } from "@/shared/constants/labels";
import { RECOMMENDED_SETTINGS } from "@/shared/constants/recommended-settings";
import type { DaoConfiguration } from "@/shared/dao-config/types";
import { ShutterOgIcon } from "@/shared/og/dao-og-icons";
import {
  RiskLevel,
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";

export const SHU: DaoConfiguration = {
  name: "Shutter",
  ogIcon: ShutterOgIcon,
  decimals: 18,
  color: {
    svgColor: "#1e1e1e",
    svgBgColor: "#fff",
  },
  forumLink: "https://shutternetwork.discourse.group/c/shutter-dao/14",
  icon: ShutterIcon,
  daoOverview: {
    token: "ERC20",
    chain: { ...mainnet, icon: MainnetIcon },
    snapshot: "https://snapshot.box/#/s:shutterdao0x36.eth/",
    contracts: {
      governor: "0xAA6BfA174d2f803b517026E93DBBEc1eBa26258e", // Azorius
      token: "0xe485E2f1bab389C08721B291f6b59780feC83Fd7",
      timelock: "0x36bD3044ab68f600f6d3e081056F34f2a58432c4", // Shutter Safe
      votingStrategy: "0x4b29d8B250B8b442ECfCd3a4e3D91933d2db720F",
    },
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: false,
      logic: "For + Abstain",
      quorumCalculation: QUORUM_CALCULATION_TYPES.TOTAL_SUPPLY,
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
          "The Shutter DAO contracts have been audited, and the audit is publicly available.",
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
          "The Shutter governance interface has a secure HTTPS connection and follows web2 standard protections.",
        impact:
          "The governance interface domain shows the basic security certificates, but without immutable decentralized storage it is not censorship-resistant or verifiable.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.INTERFACE_RESILIENCE
          ],
        nextStep:
          "The Shutter governance interface domain should be hosted on IPFS.",
        requirements: [
          "For maximum security, the DAO should have its frontend reviewed by the DAO or audit and then made verifiably immutable.",
          "A solution could look like a frontend made available on IPFS through eth.limo, with their code hashed and put on chain by the DAO, then verified for subresource integrity.",
        ],
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        currentSetting:
          "Shutter has a treasury managed solely by the DAO, with much larger holdings than the cost for proposal approval. In this case, the Veto Strategy/Security Council is necessary.",
        impact:
          "A profitable treasury heist situation creates financial incentives for an attacker to take over governance power, despite the cost required to accumulate sufficient voting weight.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ],
        nextStep:
          "The Delegated Cap should increase, incentivizing delegation to Shutter delegates. This raises the cost of attacking the DAO and reduces the potential profitability of an attack.",
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
        currentSetting:
          "It protects the DAO from a flash loan aimed at reaching the Proposal Threshold and submitting a proposal, by taking a snapshot of the governance power from delegates/holders one block before the proposal submission (LinearERC20Voting.sol:L217).",
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
        currentSetting: "The Proposal Threshold is set to 3M $SHU.",
        impact:
          "Shutter has a proposal threshold that makes it harder for attackers to be able to create proposals without reaching a significant level of accumulation first.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.PROPOSAL_THRESHOLD],
        nextStep: "The parameter is in its lowest-risk condition.",
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
          "An attacker can buy tokens to submit a proposal in the DAO, vote with them, and sell them during the voting period. There is nothing in Shutter governance that protects against this or prevents the attacker from doing so.",
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
          "Shutter has a Security Council, managed by a multisig of external signers to the core developer team.",
        impact:
          "Shutter can veto malicious proposals with the Security Council.",
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
          "An attacker can swamp the system with simultaneous proposals, overwhelming voters to approve an attack through a war of attrition.",
          "The DAO should impose—and automatically enforce—a hard cap on the number of active proposals any single address can have at once.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        currentSetting:
          "Only the DAO manages the treasury. There is no external admin role on the timelock.",
        impact:
          "Since the DAO is the only administrator, only governance can control treasury execution — decentralizing its governance.",
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
          "Shutter has a Security Council that is able to veto malicious proposals.",
        impact:
          "Shutter can veto malicious proposals with the Security Council.",
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
          "There is no Voting Delay set in the Shutter DAO governance.",
        impact:
          "The Voting Delay period is nonexistent. This gives delegates and stakeholders no time to coordinate their votes and for the DAO to protect itself against an attack. This poses a critical governance risk.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_DELAY],
        nextStep:
          "The Voting Delay needs to be increased to at least 2 days in order to be considered Medium Risk.",
        requirements: [
          "Voting delay is the time between proposal submission and the snapshot that fixes voting power. Without any delay, attackers can rush proposals before token-holders or delegates can react.",
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
          "It protects the DAO from a flash loan aimed to increase their voting power, by taking a snapshot of the governance power from delegates/holders via Snapshot/getPastVotes.",
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
        currentSetting: "The Voting Period is set to 3 days.",
        impact:
          "The Voting Period is too short. A short voting period makes it harder for stakeholders to coordinate and vote against a malicious proposal submitted to the DAO.",
        recommendedSetting:
          RECOMMENDED_SETTINGS[GovernanceImplementationEnum.VOTING_PERIOD],
        nextStep:
          "The Voting Period should be equal to or greater than 7 days.",
        requirements: [
          "A voting window of three days or less risks excluding weekend or time-zoned delegates, lowering turnout and quorum.",
          "The Voting Period must have, at least, 4 days to be classified as Medium Risk.",
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
          "A treasury managed by the DAO with much larger holdings than the cost for proposal approval creates strong financial incentives for attack. The Security Council provides a necessary layer of protection.",
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
          "A nonexistent voting delay combined with a 3-day voting period leaves almost no time for review or coordination, increasing the risk of rushed or unchallenged governance decisions.",
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
