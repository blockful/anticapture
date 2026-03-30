import type {
  OrderDirection,
  QueryInput_TokenMetrics_MetricType,
} from "@anticapture/graphql-client/hooks";
import { useTokenMetricsLazyQuery } from "@anticapture/graphql-client/hooks";

import {
  DAYS_IN_SECONDS,
  SECONDS_PER_DAY,
} from "@/shared/constants/time-related";
import type { TokenMetricItem } from "@/shared/dao-config/types";
import type { DaoIdEnum } from "@/shared/types/daos";
import type { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import type { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { getAuthHeaders } from "@/shared/utils/server-utils";

import { useCallback, useEffect, useState } from "react";

export const useTimeSeriesData = (
  daoId: DaoIdEnum,
  metricTypes: MetricTypesEnum[],
  days: TimeInterval,
  options?: {
    refreshInterval?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  },
) => {
  const [data, setData] = useState<
    Record<MetricTypesEnum, TokenMetricItem[]> | undefined
  >();
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const [fetchTokenMetrics] = useTokenMetricsLazyQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
    fetchPolicy: "network-only",
  });

  const stableMetricTypes = [...metricTypes].sort();

  const fetchAll = useCallback(async () => {
    if (!daoId || stableMetricTypes.length === 0) return;

    setIsLoading(true);
    try {
      const startDate = Math.floor(
        Date.now() / 1000 - DAYS_IN_SECONDS[days] - SECONDS_PER_DAY,
      );

      const results = await Promise.all(
        stableMetricTypes.map(async (metricType) => {
          const result = await fetchTokenMetrics({
            variables: {
              metricType:
                metricType as unknown as QueryInput_TokenMetrics_MetricType,
              startDate,
              endDate: null,
              orderDirection: "asc" as OrderDirection,
              limit: 365,
              skip: null,
            },
          });
          return {
            metricType,
            items: (result.data?.tokenMetrics?.items ??
              []) as TokenMetricItem[],
          };
        }),
      );

      const metricsByType = {} as Record<MetricTypesEnum, TokenMetricItem[]>;
      for (const { metricType, items } of results) {
        metricsByType[metricType] = items;
      }

      setData(metricsByType);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daoId, stableMetricTypes.join(","), days]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (options?.refreshInterval && options.refreshInterval > 0) {
      const interval = setInterval(fetchAll, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAll, options?.refreshInterval]);

  return {
    data,
    error,
    isLoading,
  };
};
