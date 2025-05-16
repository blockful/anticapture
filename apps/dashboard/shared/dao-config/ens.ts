import { DaoConfiguration } from "@/shared/dao-config/types";
import {
  RiskLevel,
  SupportStageEnum,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";
import { calculateMonthsBefore } from "@/shared/utils";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { EnsIcon } from "@/shared/components/icons";

export const ENS: DaoConfiguration = {
  name: "Ethereum Name Service",
  supportStage: SupportStageEnum.FULL,
  icon: EnsIcon,
  daoOverview: {
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
    },
    securityCouncil: {
      isActive: true,
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
  riskAnalysis: true,
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
      },
      [GovernanceImplementationEnum.DNS_PROTECTION]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.DNS_PROTECTION
          ].description,
        requirements: [
          "Without the proper protections(DNSSEC/SPF/DKIM/DMARC), attackers can spoof governance UIs by hijacking unprotected domains.",
          "Currently, the DAO’s domains have no DNS-level protections (High Risk).",
          "Secure every DAO‑owned domain with Industry standard and publish a security‑contact record.",
        ],
      },
      [GovernanceImplementationEnum.EXTRACTABLE_VALUE]: {
        value: "~100M USD",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.EXTRACTABLE_VALUE
          ].description,
        requirements: [
          "Once a proposal snapshot block has passed, if any single address or group has over 50% of the delegated supply, they can approve the proposal without the need of of any other support.",
          "Currently, the active supply in ENS DAO - meaning the voting power of delegates who have voted in recent proposals - is a little below 20% of the delegated supply.",
          "Even without 50% of the delegated supply, an address with over 50% of the active supply could present a big risk to the DAO if not for the Security Council, active until July 2026.",
          "The DAO should dedicate effort to the increase of governance participation, aiming at an active supply worth at least double the amount of liquid assets under governance management.",
        ],
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "100k ENS",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        requirements: [
          "A low proposal threshold lets attackers or small coalitions submit governance actions too easily, forcing the DAO to vote on spam or malicious items.",
          "The DAO should set the proposal threshold at ≥ 1 % of circulating market supply (CEX + DEX + lending pools) so that only wallets with meaningful economic stake can create proposals.",
        ],
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
        requirements: [
          "Once a proposal is submitted, the proposer can immediately dump their tokens, reducing their financial risk in case of an attack.",
          "The DAO must enforce a permissionless way to cancel any live proposal if the proposer's voting power drops below the proposal-creation threshold.",
        ],
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL
          ].description,
        requirements: [
          "Once a proposal is submitted, the proposer can immediately dump their tokens, reducing their financial risk in case of an attack.",
          "The DAO must enforce a permissionless way to cancel any live proposal if the proposer's voting power drops below the proposal-creation threshold.",
        ],
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        requirements: [
          "An attacker can swamp the system with simultaneous proposals, overwhelming voters to approve an attack through a war of attrition",
          "The DAO should impose—and automatically enforce—a hard cap on the number of active proposals any single address can have at once.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        requirements: [
          "The timelock admin can control execution, canceling, upgrades or critical parameter changes; if this power sits outside audited, DAO-approved contracts, attackers or insiders can sidestep on-chain voting.",
          "Admin rights should rest only with DAO governance plus contracts it explicitly approves after a public audit.",
        ],
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        requirements: [
          "If voters cannot revise their ballots, a last-minute interface exploit or late discovery of malicious code can trap delegates in a choice that now favors an attacker, weakening the DAO’s defense.",
          "The governance contract should let any voter overwrite their previous vote while the voting window is open—ideally through a single castVoteWithReasonAndParams call or equivalent.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "12 seconds",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        requirements: [
          "Voting delay is the time between proposal submission and the snapshot that fixes voting power. The current one-block delay lets attackers rush proposals before token-holders or delegates can react.",
          "The DAO should enforce a delay of at least two full days and have an automatic alert plan that notifies major voters the moment a proposal is posted.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes(default)",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "7 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  governanceActivity: false,
  showSupport: false,
};
