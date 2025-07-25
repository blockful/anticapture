"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { DaoIdEnum } from "@/shared/types/daos";
import { TokenDistributionContextProps } from "@/shared/contexts/types";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { useTimeSeriesData } from "@/shared/hooks";
import { formatUnits } from "viem";

const initialTokenDistributionMetricData = {
  value: undefined,
  changeRate: undefined,
};

export const TokenDistributionContext =
  createContext<TokenDistributionContextProps>({
    days: TimeInterval.ONE_YEAR,
    setDays: () => {},
    totalSupply: initialTokenDistributionMetricData,
    totalSupplyChart: [],
    circulatingSupply: initialTokenDistributionMetricData,
    circulatingSupplyChart: [],
    delegatedSupply: initialTokenDistributionMetricData,
    delegatedSupplyChart: [],
    cexSupply: initialTokenDistributionMetricData,
    cexSupplyChart: [],
    dexSupply: initialTokenDistributionMetricData,
    dexSupplyChart: [],
    lendingSupply: initialTokenDistributionMetricData,
    lendingSupplyChart: [],
  });

interface TokenDistributionProviderProps {
  children: ReactNode;
  daoId: DaoIdEnum;
}

export const calculateChangeRate = (
  data: DaoMetricsDayBucket[] = [],
): string | null => {
  if (!data || data.length < 2) return null;

  try {
    if (data.length > 0) {
      const oldHigh = data[0].high ?? "0";
      const currentHigh = data[data.length - 1]?.high ?? "0";
      if (currentHigh === "0") {
        return "0";
      } else {
        return formatUnits(
          (BigInt(currentHigh) * BigInt(1e18)) / BigInt(oldHigh) - BigInt(1e18),
          18,
        );
      }
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const TokenDistributionProvider = ({
  children,
  daoId,
}: TokenDistributionProviderProps) => {
  const [days, setDays] = useState<TimeInterval>(TimeInterval.ONE_YEAR);

  const metricTypes = [
    MetricTypesEnum.TOTAL_SUPPLY,
    MetricTypesEnum.CIRCULATING_SUPPLY,
    MetricTypesEnum.DELEGATED_SUPPLY,
    MetricTypesEnum.CEX_SUPPLY,
    MetricTypesEnum.DEX_SUPPLY,
    MetricTypesEnum.LENDING_SUPPLY,
  ];

  const { data: timeSeriesData } = useTimeSeriesData(daoId, metricTypes, days, {
    refreshInterval: 300000,
    revalidateOnFocus: false,
  });

  const value: TokenDistributionContextProps = {
    days,
    setDays,
    totalSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY],
      ),
    },
    totalSupplyChart: timeSeriesData?.[MetricTypesEnum.TOTAL_SUPPLY] || [],
    circulatingSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY]?.at(-1)?.high ??
        null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY],
      ),
    },
    circulatingSupplyChart:
      timeSeriesData?.[MetricTypesEnum.CIRCULATING_SUPPLY] || [],
    delegatedSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY]?.at(-1)?.high ??
        null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY],
      ),
    },
    delegatedSupplyChart:
      timeSeriesData?.[MetricTypesEnum.DELEGATED_SUPPLY] || [],
    cexSupply: {
      value: timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY],
      ),
    },
    cexSupplyChart: timeSeriesData?.[MetricTypesEnum.CEX_SUPPLY] || [],
    dexSupply: {
      value: timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY],
      ),
    },
    dexSupplyChart: timeSeriesData?.[MetricTypesEnum.DEX_SUPPLY] || [],
    lendingSupply: {
      value:
        timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY]?.at(-1)?.high ?? null,
      changeRate: calculateChangeRate(
        timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY],
      ),
    },
    lendingSupplyChart: timeSeriesData?.[MetricTypesEnum.LENDING_SUPPLY] || [],
  };

  return (
    <TokenDistributionContext.Provider value={value}>
      {children}
    </TokenDistributionContext.Provider>
  );
};

export const useTokenDistributionContext = () =>
  useContext(TokenDistributionContext);
