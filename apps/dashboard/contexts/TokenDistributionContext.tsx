/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { TimeInterval } from "@/lib/enums/TimeInterval";
import { DaoMetricsDayBucket } from "@/lib/dao-constants/types";
import { DaoIdEnum } from "@/lib/types/daos";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MetricData, TokenDistributionContextProps } from "./types";
import { MetricTypesEnum } from "@/lib/client/constants";
import { formatUnits } from "viem";
import { useTimeSeriesData } from "@/hooks/useTimeSeriesDataFromGraphQL";

const initialTokenDistributionMetricData = {
  value: undefined,
  changeRate: undefined,
};

export const TokenDistributionContext =
  createContext<TokenDistributionContextProps>({
    days: TimeInterval.NINETY_DAYS,
    setDays: () => {},
    totalSupply: initialTokenDistributionMetricData,
    setTotalSupply: () => {},
    totalSupplyChart: [],
    setTotalSupplyChart: () => {},
    circulatingSupply: initialTokenDistributionMetricData,
    setCirculatingSupply: () => {},
    circulatingSupplyChart: [],
    setCirculatingSupplyChart: () => {},
    delegatedSupply: initialTokenDistributionMetricData,
    setDelegatedSupply: () => {},
    delegatedSupplyChart: [],
    setDelegatedSupplyChart: () => {},
    cexSupply: initialTokenDistributionMetricData,
    setCexSupply: () => {},
    cexSupplyChart: [],
    setCexSupplyChart: () => {},
    dexSupply: initialTokenDistributionMetricData,
    setDexSupply: () => {},
    dexSupplyChart: [],
    setDexSupplyChart: () => {},
    lendingSupply: initialTokenDistributionMetricData,
    setLendingSupply: () => {},
    lendingSupplyChart: [],
    setLendingSupplyChart: () => {},
  });

export const TokenDistributionProvider = ({
  children,
  daoId,
}: {
  children: React.ReactNode;
  daoId: DaoIdEnum;
}) => {
  const [days, setDays] = useState<TimeInterval>(TimeInterval.NINETY_DAYS);
  const [totalSupply, setTotalSupply] = useState<MetricData>(
    initialTokenDistributionMetricData,
  );
  const [totalSupplyChart, setTotalSupplyChart] = useState<
    DaoMetricsDayBucket[]
  >([]);
  const [circulatingSupply, setCirculatingSupply] = useState<MetricData>(
    initialTokenDistributionMetricData,
  );
  const [circulatingSupplyChart, setCirculatingSupplyChart] = useState<
    DaoMetricsDayBucket[]
  >([]);
  const [delegatedSupply, setDelegatedSupply] = useState<MetricData>(
    initialTokenDistributionMetricData,
  );
  const [delegatedSupplyChart, setDelegatedSupplyChart] = useState<
    DaoMetricsDayBucket[]
  >([]);
  const [cexSupply, setCexSupply] = useState<MetricData>(
    initialTokenDistributionMetricData,
  );
  const [cexSupplyChart, setCexSupplyChart] = useState<DaoMetricsDayBucket[]>(
    [],
  );
  const [dexSupply, setDexSupply] = useState<MetricData>(
    initialTokenDistributionMetricData,
  );
  const [dexSupplyChart, setDexSupplyChart] = useState<DaoMetricsDayBucket[]>(
    [],
  );
  const [lendingSupply, setLendingSupply] = useState<MetricData>(
    initialTokenDistributionMetricData,
  );
  const [lendingSupplyChart, setLendingSupplyChart] = useState<
    DaoMetricsDayBucket[]
  >([]);

  const metricsWithCallBacks = useMemo(
    () => [
      {
        type: MetricTypesEnum.TOTAL_SUPPLY,
        setState: setTotalSupply,
        setChart: setTotalSupplyChart,
      },
      {
        type: MetricTypesEnum.DELEGATED_SUPPLY,
        setState: setDelegatedSupply,
        setChart: setDelegatedSupplyChart,
      },
      {
        type: MetricTypesEnum.CIRCULATING_SUPPLY,
        setState: setCirculatingSupply,
        setChart: setCirculatingSupplyChart,
      },
      {
        type: MetricTypesEnum.CEX_SUPPLY,
        setState: setCexSupply,
        setChart: setCexSupplyChart,
      },
      {
        type: MetricTypesEnum.DEX_SUPPLY,
        setState: setDexSupply,
        setChart: setDexSupplyChart,
      },
      {
        type: MetricTypesEnum.LENDING_SUPPLY,
        setState: setLendingSupply,
        setChart: setLendingSupplyChart,
      },
    ],
    [],
  );

  const metricTypes = useMemo(
    () =>
      metricsWithCallBacks.map(
        (metric) => metric.type.trim().replace(/^"|"$/g, "") as MetricTypesEnum,
      ),
    [metricsWithCallBacks],
  );

  const parsedDays = parseInt(days.split("d")[0]);

  // Use the SWR hook to fetch data
  const { data: allData, error } = useTimeSeriesData(
    daoId,
    metricTypes,
    parsedDays,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: false,
    },
  );

  // Process the data when it changes
  useEffect(() => {
    if (error) {
      console.error("Error fetching token distribution data:", error);
      // Set default states on error
      metricsWithCallBacks.forEach((metric) => {
        metric.setState(initialTokenDistributionMetricData);
        metric.setChart([]);
      });
      return;
    }

    if (!allData) return; // Skip if data is not loaded yet

    // Process each metric with its data
    metricsWithCallBacks.forEach((metric) => {
      const metricType = metric.type
        .trim()
        .replace(/^"|"$/g, "") as MetricTypesEnum;
      const data = allData[metricType] || [];

      if (data.length > 0) {
        let changeRate;
        const oldHigh = data[0].high ?? "0";
        const currentHigh = data[data.length - 1]?.high ?? "0";
        if (currentHigh === "0") {
          changeRate = "0";
        } else {
          changeRate = formatUnits(
            (BigInt(currentHigh) * BigInt(1e18)) / BigInt(oldHigh) -
              BigInt(1e18),
            18,
          );
        }
        metric.setState({ value: currentHigh, changeRate });
        metric.setChart(data);
      } else {
        metric.setState(initialTokenDistributionMetricData);
        metric.setChart([]);
      }
    });
  }, [allData, error, metricsWithCallBacks]);

  return (
    <TokenDistributionContext.Provider
      value={{
        days,
        totalSupply,
        totalSupplyChart,
        circulatingSupply,
        circulatingSupplyChart,
        delegatedSupply,
        delegatedSupplyChart,
        cexSupply,
        cexSupplyChart,
        dexSupply,
        dexSupplyChart,
        lendingSupply,
        lendingSupplyChart,
        setDays,
        setTotalSupply,
        setTotalSupplyChart,
        setCirculatingSupply,
        setCirculatingSupplyChart,
        setDelegatedSupply,
        setDelegatedSupplyChart,
        setCexSupply,
        setCexSupplyChart,
        setDexSupply,
        setDexSupplyChart,
        setLendingSupply,
        setLendingSupplyChart,
      }}
    >
      {children}
    </TokenDistributionContext.Provider>
  );
};

export const useTokenDistributionContext = () =>
  useContext(TokenDistributionContext);
