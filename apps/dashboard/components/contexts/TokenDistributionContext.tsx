/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { TimeInterval } from "@/lib/enums/TimeInterval";
import {
  DaoMetricsDayBucket,
  fetchTimeSeriesDataFromGraphQL,
} from "@/lib/server/backend";
import { DaoIdEnum } from "@/lib/types/daos";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { TokenDistributionContext } from "./types";
import { MetricTypesEnum } from "@/lib/client/constants";
import { formatUnits } from "viem";


export const TokenDistributionCtx = createContext<TokenDistributionContext>({
  days: TimeInterval.NINETY_DAYS,
  setDays: () => {},
  totalSupply: { value: undefined, changeRate: undefined },
  setTotalSupply: () => {},
  totalSupplyChart: [],
  setTotalSupplyChart: () => {},
  circulatingSupply: { value: undefined, changeRate: undefined },
  setCirculatingSupply: () => {},
  circulatingSupplyChart: [],
  setCirculatingSupplyChart: () => {},
  delegatedSupply: { value: undefined, changeRate: undefined },
  setDelegatedSupply: () => {},
  delegatedSupplyChart: [],
  setDelegatedSupplyChart: () => {},
  cexSupply: { value: undefined, changeRate: undefined },
  setCexSupply: () => {},
  cexSupplyChart: [],
  setCexSupplyChart: () => {},
  dexSupply: { value: undefined, changeRate: undefined },
  setDexSupply: () => {},
  dexSupplyChart: [],
  setDexSupplyChart: () => {},
  lendingSupply: { value: undefined, changeRate: undefined },
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
  const [totalSupply, setTotalSupply] = useState<{
    value: string | undefined;
    changeRate: string | undefined;
  }>({
    value: undefined,
    changeRate: undefined,
  });
  const [totalSupplyChart, setTotalSupplyChart] = useState<DaoMetricsDayBucket[]>([]);  
  const [circulatingSupply, setCirculatingSupply] = useState<{
    value: string | undefined;
    changeRate: string | undefined;
  }>({
    value: undefined,
    changeRate: undefined,
  });
  const [circulatingSupplyChart, setCirculatingSupplyChart] = useState<DaoMetricsDayBucket[]>([]);
  const [delegatedSupply, setDelegatedSupply] = useState<{
    value: string | undefined;
    changeRate: string | undefined;
  }>({
    value: undefined,
    changeRate: undefined,
  });
  const [delegatedSupplyChart, setDelegatedSupplyChart] = useState<DaoMetricsDayBucket[]>([]);
  const [cexSupply, setCexSupply] = useState<{
    value: string | undefined;
    changeRate: string | undefined;
  }>({
    value: undefined,
    changeRate: undefined,
  });
  const [cexSupplyChart, setCexSupplyChart] = useState<DaoMetricsDayBucket[]>([]);
  const [dexSupply, setDexSupply] = useState<{
    value: string | undefined;
    changeRate: string | undefined; 
  }>({
    value: undefined,
    changeRate: undefined,
  });
  const [dexSupplyChart, setDexSupplyChart] = useState<DaoMetricsDayBucket[]>([]);
  const [lendingSupply, setLendingSupply] = useState<{
    value: string | undefined;
    changeRate: string | undefined;
  }>({
    value: undefined,
    changeRate: undefined,
  });
  const [lendingSupplyChart, setLendingSupplyChart] = useState<DaoMetricsDayBucket[]>([]);

  const metricsWithCallBacks = [
    { type: MetricTypesEnum.TOTAL_SUPPLY, setState: setTotalSupply , setChart: setTotalSupplyChart },
    { type: MetricTypesEnum.DELEGATED_SUPPLY, setState: setDelegatedSupply, setChart: setDelegatedSupplyChart },
    { type: MetricTypesEnum.CIRCULATING_SUPPLY, setState: setCirculatingSupply, setChart: setCirculatingSupplyChart },
    { type: MetricTypesEnum.CEX_SUPPLY, setState: setCexSupply, setChart: setCexSupplyChart },
    { type: MetricTypesEnum.DEX_SUPPLY, setState: setDexSupply, setChart: setDexSupplyChart },
    { type: MetricTypesEnum.LENDING_SUPPLY, setState: setLendingSupply, setChart: setLendingSupplyChart },
  ];


  const fetchTokenDistributionData = useCallback(async () => {
    await Promise.all(
        metricsWithCallBacks.map(async(metric) => {
        const metricType = metric.type
          .trim()
          .replace(/^"|"$/g, "") as MetricTypesEnum;
        const parsedDays = parseInt(days.split("d")[0]);
        const data = await fetchTimeSeriesDataFromGraphQL(daoId, metricType, parsedDays);
        let changeRate;
        const oldHigh = data[0].high ?? "0";
        const currentHigh =
        data[data.length-1]?.high ?? "0";
        if (currentHigh === "0") {
          changeRate = "0";
        } else {
          changeRate = formatUnits(
            (BigInt(currentHigh) * BigInt(1e18)) / BigInt(oldHigh) -
              BigInt(1e18),
            18,
          );
        }
        metric.setState({value: currentHigh, changeRate});
        metric.setChart(data);
      }))
  }, [days, daoId]);

  useEffect(()=>{
      fetchTokenDistributionData()
  }, [fetchTokenDistributionData]);

  return (
    <TokenDistributionCtx.Provider value={
        {
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
        }
    }>
      {children}
    </TokenDistributionCtx.Provider>
  );
};

export const useTokenDistributionContext = () => useContext(TokenDistributionCtx);
