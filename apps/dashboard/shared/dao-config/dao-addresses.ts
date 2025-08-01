import { DaoIdEnum } from "@/shared/types/daos";
import { DaoAddresses } from "@/shared/dao-config/types";

export const DAO_ADDRESSES: DaoAddresses = {
  [DaoIdEnum.UNISWAP]: {
    UniTimelock: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
    UniTokenDistributor: "0x090D4613473dEE047c3f2706764f49E0821D256e",
    Univ3Uni: "0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801",
  },
  [DaoIdEnum.ENS]: {
    ENSTokenTimelock: "0xd7A029Db2585553978190dB5E85eC724Aa4dF23f",
    ENSDaoWallet: "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7",
    ENSColdWallet: "0x690F0581eCecCf8389c223170778cD9D029606F2",
  },
  [DaoIdEnum.OPTIMISM]: {
    OptimismTimelock: "",
    OptimismTokenDistributor: "",
    OptimismUniv3Uni: "",
  },
  [DaoIdEnum.ARBITRUM]: {
    ArbitrumDaoWallet: "",
    ArbitrumTimelock: "",
    ArbitrumTokenDistributor: "",
  },
};

export const DAO_VETO_COUNCIL_ADDRESSES: Record<DaoIdEnum, string | undefined> =
  {
    [DaoIdEnum.UNISWAP]: undefined,
    [DaoIdEnum.ENS]: "0x552DF471a4c7Fea11Ea8d7a7b0Acc6989b902a95",
    [DaoIdEnum.OPTIMISM]: undefined,
    [DaoIdEnum.ARBITRUM]: undefined,
    [DaoIdEnum.SHUTTER]: undefined,
  };
