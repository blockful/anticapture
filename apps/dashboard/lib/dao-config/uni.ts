import { RiskLevel, SupportStageEnum } from "@/lib/enums";
import { DaoConfiguration } from "@/lib/dao-config/types";
import UNILogo from "@/public/logo/UNI.png";

export const UNI: DaoConfiguration = {
  name: "Uniswap",
  icon: UNILogo,
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
  attackProfitability: {
    riskLevel: RiskLevel.LOW,
    supportsLiquidTreasuryCall: false,
  },
  tokenDistribution: true,
  governanceActivity: true,
};
