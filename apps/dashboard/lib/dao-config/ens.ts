import { DaoConfiguration } from "@/lib/dao-config/types";
import { RiskLevel, sortByRiskLevel, SupportStageEnum } from "@/lib/enums";
import ENSLogo from "@/public/logo/ENS.png";
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
    fields: [
      {
        name: "Vote Mutability",
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "The governance contract accepts changes to votes, even after they have been cast on-chain.",
      },
      {
        name: "DNS Protection",
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "DNS (Domain Name Service) is the name given to domains/websites on the Internet. They may be vulnerable to attacks, and it is up to the DAO to create mechanisms to protect against them.",
      },
      {
        name: "Voting Delay",
        value: "12 seconds",
        riskLevel: RiskLevel.HIGH,
        description:
          "Waiting period between proposal submission and the snapshot to count for voting power and start the votes.",
      },
      {
        name: "Proposer Balance Cancel",
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "Once submitted to governance, a proposal may be canceled by anyone if the wallet that submitted it no longer has the number of governance tokens required to reach the proposal threshold.",
      },
      {
        name: "Spam Prevention",
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "An attacker can submit several proposals at once to trick the organization members into approving a malicious proposal or to try a brute force battle with the delegates, similar to a DDOS attack on the governance level.",
      },
      {
        name: "Voting Subsidy",
        value: "Yes, unrestricted",
        riskLevel: RiskLevel.HIGH,
        description:
          'The DAO can sponsor the gas costs of voting for its members, allowing them to essentially "vote for free". If done without restrictions can be exploited to spend DAO funds.',
      },
      {
        name: "Flashloan Protection",
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "This security feature helps prevent users borrowing a flashloan to increase. For one block only, the number of votes/tokens in a wallet. Only the governance tokens held in the block preceding the submission/voting of the proposal count as voting power.",
      },
      {
        name: "Timelock Delay",
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          "Waiting period between the approval of a proposal, prior to executing the automatic execution of a malicious proposal that negatively affects the DAO, allowing time for a Cancel or Veto function to act.",
      },
      {
        name: "Veto Strategy",
        value: "DAO Approved",
        riskLevel: RiskLevel.LOW,
        description:
          "There is a mechanism approved by the DAO to cancel a proposal approved by governance after it has been voted.",
      },
      {
        name: "Proposal Threshold",
        value: "100k ENS",
        riskLevel: RiskLevel.LOW,
        description:
          "Requires a minimum number of votes to submit a proposal to governance.",
      },
      {
        name: "Security Council",
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "Group of people responsible for taking action to increase the DAO's security against harmful proposals, through a multisig administered by them. Ideally following L2Beat security council standard.",
      },
      {
        name: "Voting Period",
        value: "7 days",
        riskLevel: RiskLevel.LOW,
        description:
          "Period in which wallets with delegated governance tokens have the opportunity to vote on proposals submitted to governance.",
      },
      {
        name: "Timelock Admin",
        value: "DAO Only",
        riskLevel: RiskLevel.LOW,
        description:
          "Timelock administration can be transferred or shared with addresses other than the DAO itself. If this happens, the main piece of governance is put at risk.",
      },
      {
        name: "Proposer Cancel",
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "An user can cancel a proposal they submitted themselves to the DAO at any point. Allows for proposal with unintentional mistakes to be taken down by a non-malicious actor.",
      },
      {
        name: "Audited Contracts",
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          "The governance contract codes have been audited and approved by a security provider.",
      },
    ].sort((a, b) => sortByRiskLevel(a, b, "desc")),
  },
  tokenDistribution: true,
  governanceActivity: false,
  showSupport: false,
};
