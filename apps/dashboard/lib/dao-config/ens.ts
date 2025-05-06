import { DaoConfiguration } from "@/lib/dao-config/types";
import {
  RiskLevel,
  sortByRiskLevel,
  SupportStageEnum,
  GovernanceImplementationEnum,
} from "@/lib/enums";
import { calculateMonthsBefore } from "@/lib/client/utils";

export const ENS: DaoConfiguration = {
  name: "Ethereum Name Service",
  supportStage: SupportStageEnum.FULL,
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
    fields: {
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "The governance contract accepts changes to votes, even after they have been cast on-chain.",
        requirements: [
          "If voters cannot revise their ballots, a last-minute interface exploit or late discovery of malicious code can trap delegates in a choice that now favors an attacker, weakening the DAO’s defense.",
          "The governance contract should let any voter overwrite their previous vote while the voting window is open—ideally through a single castVoteWithReasonAndParams call or equivalent.",
        ],
      },
      [GovernanceImplementationEnum.DNS_PROTECTION]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "DNS (Domain Name Service) is the name given to domains/websites on the Internet. They may be vulnerable to attacks, and it is up to the DAO to create mechanisms to protect against them.",
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "12 seconds",
        riskLevel: RiskLevel.HIGH,
        description:
          "Waiting period between proposal submission and the snapshot to count for voting power and start the votes.",
        requirements: [
          "Voting delay is the time between proposal submission and the snapshot that fixes voting power. The current one-block delay lets attackers rush proposals before token-holders or delegates can react.",
          "The DAO should enforce a delay of at least two full days and have an automatic alert plan that notifies major voters the moment a proposal is posted.",
        ],
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "Once submitted to governance, a proposal may be canceled by anyone if the wallet that submitted it no longer has the number of governance tokens required to reach the proposal threshold.",
        requirements: [
          "Once a proposal is submitted, the proposer can immediately dump their tokens, reducing their financial risk in case of an attack.",
          "The DAO must enforce a permissionless way to cancel any live proposal if the proposer’s voting power drops below the proposal-creation threshold.",
        ],
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "An attacker can submit several proposals at once to trick the organization members into approving a malicious proposal or to try a brute force battle with the delegates, similar to a DDOS attack on the governance level.",
        requirements: [
          "An attacker can swamp the system with simultaneous proposals, overwhelming voters to approve an attack through a war of attrition",
          "The DAO should impose—and automatically enforce—a hard cap on the number of active proposals any single address can have at once.",
        ],
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "Yes, unrestricted",
        riskLevel: RiskLevel.HIGH,
        description:
          'The DAO can sponsor the gas costs of voting for its members, allowing them to essentially "vote for free". If done without restrictions can be exploited to spend DAO funds.',
      },
      [GovernanceImplementationEnum.FLASH_LOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "This security feature helps prevent users borrowing a flashloan to increase. For one block only, the number of votes/tokens in a wallet. Only the governance tokens held in the block preceding the submission/voting of the proposal count as voting power.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          "Waiting period between the approval of a proposal, prior to executing the automatic execution of a malicious proposal that negatively affects the DAO, allowing time for a Cancel or Veto function to act.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "DAO Approved",
        riskLevel: RiskLevel.LOW,
        description:
          "There is a mechanism approved by the DAO to cancel a proposal approved by governance after it has been voted.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "100k ENS",
        riskLevel: RiskLevel.LOW,
        description:
          "Requires a minimum number of votes to submit a proposal to governance.",
        requirements: [
          "A low proposal threshold lets attackers or small coalitions submit governance actions too easily, forcing the DAO to vote on spam or malicious items.",
          "The DAO should set the proposal threshold at ≥ 1 % of circulating market supply (CEX + DEX + lending pools) so that only wallets with meaningful economic stake can create proposals.",
        ],
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "Group of people responsible for taking action to increase the DAO's security against harmful proposals, through a multisig administered by them. Ideally following L2Beat security council standard.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "7 days",
        riskLevel: RiskLevel.LOW,
        description:
          "Period in which wallets with delegated governance tokens have the opportunity to vote on proposals submitted to governance.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "DAO Only",
        riskLevel: RiskLevel.LOW,
        description:
          "Timelock administration can be transferred or shared with addresses other than the DAO itself. If this happens, the main piece of governance is put at risk.",
        requirements: [
          "The timelock admin can control execution, canceling, upgrades or critical parameter changes; if this power sits outside audited, DAO-approved contracts, attackers or insiders can sidestep on-chain voting.",
          "Admin rights should rest only with DAO governance plus contracts it explicitly approves after a public audit.",
        ],
      },
      [GovernanceImplementationEnum.CANCEL_FUNCTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "An user can cancel a proposal they submitted themselves to the DAO at any point. Allows for proposal with unintentional mistakes to be taken down by a non-malicious actor.",
      },
      [GovernanceImplementationEnum.AUDITED_CONTRACTS]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "The governance contract codes have been audited and approved by a security provider.",
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  governanceActivity: false,
  showSupport: false,
};
