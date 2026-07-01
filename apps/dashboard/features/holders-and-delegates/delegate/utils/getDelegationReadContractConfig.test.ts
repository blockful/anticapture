import { getDelegationReadContractConfig } from "@/features/holders-and-delegates/delegate/utils/getDelegationReadContractConfig";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";

describe("getDelegationReadContractConfig", () => {
  test("returns TORN governor delegatedTo read config", () => {
    expect(getDelegationReadContractConfig(DaoIdEnum.TORN)).toEqual({
      address: daoConfigByDaoId.TORN.daoOverview.contracts.governor,
      functionName: "delegatedTo",
    });
  });

  test("returns token delegates read config for non-TORN DAOs", () => {
    expect(getDelegationReadContractConfig(DaoIdEnum.UNISWAP)).toEqual({
      address: daoConfigByDaoId[DaoIdEnum.UNISWAP].daoOverview.contracts.token,
      functionName: "delegates",
    });
  });

  test("returns no address when a single-address contract target is missing", () => {
    expect(getDelegationReadContractConfig(DaoIdEnum.TORN, {})).toEqual({
      address: undefined,
      functionName: "delegatedTo",
    });

    expect(getDelegationReadContractConfig(DaoIdEnum.UNISWAP, {})).toEqual({
      address: undefined,
      functionName: "delegates",
    });
  });
});
