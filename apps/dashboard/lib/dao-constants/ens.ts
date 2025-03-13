import { DaoConstants } from "@/lib/dao-constants/types";
import { RiskLevel } from "../enums";

export const ENS: DaoConstants = {
  name: "Ethereum Name Service",
  contracts: {
    governor: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
    token: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    timelock: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
  },
  cancelFunction: undefined,
  snapshot: "https://snapshot.box/#/s:ens.eth",
  rules: {
    delay: true,
    changeVote: true,
    timelock: true,
    cancelFunction: false,
  },
  supportsLiquidTreasuryCall: true,
  securityCouncil: {
    isActive: true,
    multisig: {
      threshold: 4,
      signers: 8,
      externalLink:
        "https://app.safe.global/home?safe=eth:0xaA5cD05f6B62C3af58AE9c4F3F7A2aCC2Cdc2Cc7",
    },
    expiration: {
      date: "26 July 2026",
      timestamp: 1784919179,
    },
  },
  governanceImplementation: {
    fields: [
      {
        name: "Vote Mutability",
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          "Votes cannot be changed after being cast. The risk it implies is that a malicious actor will have the votes he acquired counted as valid for a proposal without the victims being able to change their votes.",
      },
      {
        name: "Proposal Threshold",
        value: "100k ENS",
        riskLevel: RiskLevel.LOW,
        description:
          "Proposal Threshold is the minimum amount of voting power required to launch a proposal.",
      },
      {
        name: "Voting Delay",
        value: "1 block",
        riskLevel: RiskLevel.LOW,
        description:
          "The voting delay is the number of blocks between an on-chain proposal’s submission and the start of its voting period. It gives DAO members time to discuss and review proposals before voting begins.The voting delay is the number of blocks between an on-chain proposal’s submission and the start of its voting period. It gives DAO members time to discuss and review proposals before voting begins.",
      },
      {
        name: "Voting Period",
        value: "7 days",
        riskLevel: RiskLevel.MEDIUM,
        description:  
          "Time it takes for a user to vote on a proposal. It can affects the time ",
      },
      {
        name: "Timelock Delay",
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          "Proposals can be executed immediately after being passed.",
      },
      {
        name: "Cancel Function",
        value: "No",
        riskLevel: RiskLevel.LOW,
        description:
          "Proposals can be executed immediately after being passed.",
      },
    ],
  },
};
