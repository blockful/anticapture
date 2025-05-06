import { RiskLevel, SupportStageEnum } from "@/lib/enums";
import { DaoConfiguration } from "@/lib/dao-config/types";
import { GovernanceImplementationEnum } from "@/lib/enums/GovernanceImplementation";

export const UNI: DaoConfiguration = {
  name: "Uniswap",
  supportStage: SupportStageEnum.FULL,
  daoOverview: {
    contracts: {
      governor: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
      token: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      timelock: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
    },
    cancelFunction:
      "https://etherscan.io/address/0x1a9C8182C09F50C8318d769245beA52c32BE35BC#writeContract%23F2",
    snapshot: "https://snapshot.box/#/s:uniswapgovernance.eth",
    rules: {
      delay: true,
      changeVote: true,
      timelock: true,
      cancelFunction: true,
    },
  },
  governanceImplementation: {
    fields: {
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          "The governance contract accepts changes to votes, even after they have been cast on-chain.",
      },
      [GovernanceImplementationEnum.DNS_PROTECTION]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "DNS (Domain Name Service) is the name given to domains/websites on the Internet. They may be vulnerable to attacks, and it is up to the DAO to create mechanisms to protect against them.",
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "44h",
        riskLevel: RiskLevel.MEDIUM,
        description:
          "Waiting period between proposal submission and the snapshot to count for voting power and start the votes.",
      },
      [GovernanceImplementationEnum.PROPOSER_BALANCE_CANCEL]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "Once submitted to governance, a proposal may be canceled by anyone if the wallet that submitted it no longer has the number of governance tokens required to reach the proposal threshold.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "An attacker can submit several proposals at once to trick the organization members into approving a malicious proposal or to try a brute force battle with the delegates, similar to a DDOS attack on the governance level.",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          'The DAO can sponsor the gas costs of voting for its members, allowing them to essentially "vote for free". If done without restrictions can be exploited to spend DAO funds.',
      },
      [GovernanceImplementationEnum.FLASHLOAN_PROTECTION]: {
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
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "1M UNI",
        riskLevel: RiskLevel.MEDIUM,
        description:
          "Requires a minimum number of votes to submit a proposal to governance.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "5d 6h",
        riskLevel: RiskLevel.MEDIUM,
        description:
          "Period in which wallets with delegated governance tokens have the opportunity to vote on proposals submitted to governance.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "Only Governor",
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
      [GovernanceImplementationEnum.EXTRACTABLE_VALUE]: {
        value: "<10k USD",
        riskLevel: RiskLevel.LOW,
        description:
          "The amount of Non-governance tokens the DAO is currently holding.",
      },
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    supportsLiquidTreasuryCall: false,
  },
  riskAnalysis: true,
  tokenDistribution: true,
  governanceActivity: true,
};
