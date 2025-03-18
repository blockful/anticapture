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
  attackProfitability: {
    riskLevel: RiskLevel.HIGH,
  },
};
