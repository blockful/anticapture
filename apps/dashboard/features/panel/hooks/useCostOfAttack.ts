import { useMemo } from "react";
import { formatUnits } from "viem";

import { useDaoTokenHistoricalData } from "@/features/attack-profitability/hooks";
import daoConfigByDaoId from "@/shared/dao-config";
import { useActiveSupply } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";

export const useCostOfAttack = (daoId: DaoIdEnum) => {
  const timeInterval = TimeInterval.NINETY_DAYS;
  const activeSupply = useActiveSupply(daoId, timeInterval);

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
      !activeSupply.data?.activeSupply ||
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

    const activeSupplyValue = Number(
      formatUnits(BigInt(activeSupply.data.activeSupply), daoConfig.decimals),
    );

    return activeSupplyValue * lastPrice;
  }, [
    activeSupply.data?.activeSupply,
    daoTokenPriceHistoricalData,
    daoConfig.decimals,
  ]);

  return {
    costOfAttack,
    isLoading: activeSupply.isLoading || daoTokenPriceHistoricalDataLoading,
  };
};
