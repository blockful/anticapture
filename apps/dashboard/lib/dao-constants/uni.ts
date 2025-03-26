import { RiskLevel } from "@/lib/enums";
import { DaoConstants } from "@/lib/dao-constants/types";
import UNILogo from "@/public/logo/UNI.png";
import { DaoIdEnum } from "@/lib/types/daos";

export const UNI: DaoConstants = {
  name: "Uniswap",
  daoId: DaoIdEnum.UNISWAP,
  icon: UNILogo,
  inAnalysis: false,
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
  supportsLiquidTreasuryCall: false,
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
  },
};
