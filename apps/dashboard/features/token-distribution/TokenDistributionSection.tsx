"use client";

import { useMemo, useState } from "react";
import {
  TokenDistributionChart,
  TokenDistributionMetrics,
} from "@/features/token-distribution/components";
import { DownloadIcon } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/shared/components/ui/card";
import { DaoIdEnum } from "@/shared/types/daos";
import { metricsSchema } from "@/features/token-distribution/utils";
import { useChartMetrics } from "@/features/token-distribution/hooks/useChartMetrics";
import { useTokenDistributionStore } from "@/features/token-distribution/store/useTokenDistributionStore";
import { CSVLink } from "react-csv";
import { defaultLinkVariants } from "@/shared/components/design-system/links/default-link";
import { ChartDataSetPoint } from "@/shared/dao-config/types";
import daoConfig from "@/shared/dao-config";
import { TransactionsTable } from "@/features/transactions";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useBrushStore } from "@/features/token-distribution/store/useBrushStore";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";

type CsvRow = Record<string, number | string | null>;

export const TokenDistributionSection = ({ daoId }: { daoId: DaoIdEnum }) => {
  const [hoveredMetricKey, setHoveredMetricKey] = useState<string | null>(null);
  const [hasTransfer, setHasTransfer] = useState<boolean>(true);
  const { metrics, setMetrics } = useTokenDistributionStore();
  const daoCfg = daoConfig[daoId];

  const { chartData, chartConfig, isLoading } = useChartMetrics({
    appliedMetrics: metrics,
    daoId,
    metricsSchema,
    tokenType: daoCfg.daoOverview.token,
  });

  const buildCsvData = (
    points: ChartDataSetPoint[] | undefined,
    appliedMetrics: string[],
  ): CsvRow[] => {
    if (!points || points.length === 0) return [];

    const ordered = [...points].sort((a, b) => a.date - b.date);

    return ordered.map((p) => {
      const row: CsvRow = {
        timestamp: p.date,
        date: new Date(p.date * 1000).toISOString(),
      };

      appliedMetrics.forEach((metricKey) => {
        const schema = chartConfig[metricKey];
        if (!schema) {
          row[metricKey] = null;
          return;
        }

        const rawValue = p[metricKey as keyof ChartDataSetPoint];

        if (schema.type === "SPORADIC_LINE") {
          if (typeof rawValue === "string") {
            row[metricKey] = rawValue || "";
          } else if (rawValue == null) {
            row[metricKey] = "";
          } else {
            row[metricKey] = Number(rawValue);
          }
        } else {
          if (rawValue == null || rawValue === "") {
            row[metricKey] = null;
          } else {
            const n = Number(rawValue);
            row[metricKey] = Number.isFinite(n) ? n : null;
          }
        }
      });

      return row;
    });
  };

  const csvData = buildCsvData(chartData, metrics);

  const switchValue = useMemo(() => {
    return metrics.length > 0
      ? "Non-Transfer"
      : hasTransfer
        ? "All"
        : "Non-Transfer";
  }, [metrics, hasTransfer]);

  const { brushRange } = useBrushStore();
  const debouncedBrushRange = useDebouncedValue(brushRange, 800);
  const startDate = useMemo(() => {
    return chartData?.[debouncedBrushRange.startIndex]?.date;
  }, [chartData, debouncedBrushRange.startIndex]);

  const endDate = useMemo(() => {
    return chartData?.[debouncedBrushRange.endIndex]?.date;
  }, [chartData, debouncedBrushRange.endIndex]);

  return (
    <div className="flex flex-col gap-[13px]">
      <Card className="xl:border-light-dark xl:bg-surface-default xl4k:max-w-full flex flex-col gap-4 rounded-lg border-none shadow-none xl:max-w-full xl:flex-row xl:gap-0 xl:border">
        <CardContent className="order-2 flex h-full w-full flex-col gap-6 p-0 xl:order-1">
          <div className="flex h-full w-full gap-1.5">
            <CardTitle className="!text-alternative-sm text-primary flex items-center font-mono font-medium uppercase tracking-wide xl:gap-2.5">
              GOVERNANCE SUPPLY TRENDS
            </CardTitle>
            {csvData && (
              <CSVLink
                filename={"governance_supply_trends.csv"}
                data={csvData}
                className="!text-alternative-sm text-secondary mb-0.5 flex items-center font-mono font-medium"
              >
                [
                <p className={defaultLinkVariants({ variant: "highlight" })}>
                  CSV <DownloadIcon className="size-3.5" />
                </p>
                ]
              </CSVLink>
            )}
          </div>
          <TokenDistributionChart
            daoId={daoId}
            isLoading={isLoading}
            appliedMetrics={metrics}
            chartConfig={chartConfig}
            chartData={chartData}
            hoveredMetricKey={hoveredMetricKey}
            context="section"
          />
        </CardContent>
        <div className="border-light-dark mx-4 w-px border border-dashed xl:order-2" />
        <div className="order-1 w-full items-start xl:order-3 xl:w-[300px] xl:min-w-[300px] xl:max-w-[300px]">
          <TokenDistributionMetrics
            daoId={daoId}
            appliedMetrics={metrics}
            setAppliedMetrics={setMetrics}
            setHoveredMetricKey={setHoveredMetricKey}
            chartData={chartData}
          />
        </div>
      </Card>
      <CardContent className="order-2 flex h-full w-full flex-col gap-6 p-0 xl:order-1">
        <div className="flex h-full w-full justify-between gap-1.5">
          <CardTitle className="!text-alternative-sm text-primary flex items-center font-mono font-medium uppercase tracking-wide xl:gap-2.5">
            TRANSACTIONS
          </CardTitle>
          <Tabs
            defaultValue="All"
            value={switchValue}
            className="flex gap-1 rounded-md"
          >
            <TabsList>
              {["Non-Transfer", "All"].map((option) => (
                <TabsTrigger
                  className="cursor-pointer px-3 py-0.5 text-sm font-normal"
                  key={option}
                  value={option}
                  onClick={() => setHasTransfer(option === "All")}
                  disabled={metrics.length > 0}
                >
                  {option}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <TransactionsTable
          metrics={metrics}
          hasTransfer={hasTransfer}
          endDate={endDate}
          startDate={startDate}
        />
      </CardContent>
    </div>
  );
};
