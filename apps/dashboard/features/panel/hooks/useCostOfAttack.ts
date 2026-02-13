import { formatUnits } from "viem";
import { useMemo } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { useDelegatedSupply } from "@/shared/hooks";
import { useDaoTokenHistoricalData } from "@/features/attack-profitability/hooks";
import daoConfigByDaoId from "@/shared/dao-config";

export const useCostOfAttack = (daoId: DaoIdEnum) => {
  const timeInterval = TimeInterval.NINETY_DAYS;
  const delegatedSupply = useDelegatedSupply(daoId, timeInterval);

  const {
    data: daoTokenPriceHistoricalData,
    loading: daoTokenPriceHistoricalDataLoading,
  } = useDaoTokenHistoricalData({
    daoId,
    limit: 1,
  });
  const daoConfig = daoConfigByDaoId[daoId];

  const costOfAttack = useMemo(() => {
    if (
      !delegatedSupply.data?.currentDelegatedSupply ||
      !daoTokenPriceHistoricalData.length
    ) {
      return null;
    }

    const lastPrice =
      daoTokenPriceHistoricalData.length > 0
        ? Number(
            daoTokenPriceHistoricalData[daoTokenPriceHistoricalData.length - 1]
              .price,
          )
        : 0;

    const delegatedSupplyValue = Number(
      formatUnits(
        BigInt(delegatedSupply.data.currentDelegatedSupply),
        daoConfig.decimals,
      ),
    );

    return delegatedSupplyValue * lastPrice;
  }, [
    delegatedSupply.data?.currentDelegatedSupply,
    daoTokenPriceHistoricalData,
    daoConfig.decimals,
  ]);

  return {
    costOfAttack,
    isLoading: delegatedSupply.isLoading || daoTokenPriceHistoricalDataLoading,
  };
};
