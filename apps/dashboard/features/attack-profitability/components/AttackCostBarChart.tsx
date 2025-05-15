"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useActiveSupply,
  useAverageTurnout,
  useDelegatedSupply,
} from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
  LabelProps,
} from "recharts";
import { SkeletonRow } from "@/shared/components";
import { TimeInterval } from "@/shared/types/enums/time-related";
import { formatEther } from "viem";
import { useParams } from "next/navigation";
import { formatNumberUserReadable } from "@/shared/utils/utils";
import { useScreenSize } from "@/shared/hooks";
import { mockedAttackCostBarData } from "@/shared/constants/mocked-data/mocked-attack-cost-bar-data";
import {
  useDaoTokenHistoricalData,
  useTopTokenHolderNonDao,
  useTreasuryAssetNonDaoToken,
  useVetoCouncilVotingPower,
} from "@/features/attack-profitability/hooks";

interface StackedValue {
  value: number;
  label: string;
  color: string;
}

const enum BarChartEnum {
  REGULAR = "Regular",
  STACKED = "Stacked",
}

interface ChartDataItem {
  name: string;
  id: string;
  type: BarChartEnum;
  value?: number;
  displayValue?: string;
  stackedValues?: StackedValue[];
  customColor?: string;
}

interface AttackCostBarChartProps {
  className?: string;
}

export const AttackCostBarChart = ({ className }: AttackCostBarChartProps) => {
  const { daoId }: { daoId: string } = useParams();
  const selectedDaoId = daoId.toUpperCase() as DaoIdEnum;
  const timeInterval = TimeInterval.ONE_YEAR;
  const [mocked, setMocked] = useState<boolean>(false);
  const liquidTreasury = useTreasuryAssetNonDaoToken(
    selectedDaoId,
    timeInterval,
  );
  const delegatedSupply = useDelegatedSupply(selectedDaoId, timeInterval);
  const activeSupply = useActiveSupply(selectedDaoId, timeInterval);
  const averageTurnout = useAverageTurnout(selectedDaoId, timeInterval);
  const {
    data: daoTokenPriceHistoricalData,
    loading: daoTokenPriceHistoricalDataLoading,
  } = useDaoTokenHistoricalData(selectedDaoId);

  const {
    data: daoTopTokenHolderExcludingTheDao,
    isLoading: daoTopTokenHolderExcludingTheDaoLoading,
  } = useTopTokenHolderNonDao(selectedDaoId);

  const { data: vetoCouncilVotingPower, isLoading: isVetoCouncilLoading } =
    useVetoCouncilVotingPower(selectedDaoId);

  const { isMobile } = useScreenSize();

  const lastPrice = useMemo(() => {
    const prices = daoTokenPriceHistoricalData.prices;
    return prices.length > 0 ? prices[prices.length - 1][1] : 0;
  }, [daoTokenPriceHistoricalData]);
  useEffect(() => {
    if (
      delegatedSupply.data?.currentDelegatedSupply === undefined &&
      activeSupply.data?.activeSupply === "0" &&
      averageTurnout.data?.currentAverageTurnout === null &&
      daoTopTokenHolderExcludingTheDao?.balance === undefined &&
      vetoCouncilVotingPower === null
    ) {
      setMocked(true);
    } else {
      setMocked(false);
    }
  }, [
    delegatedSupply,
    activeSupply,
    averageTurnout,
    daoTopTokenHolderExcludingTheDao,
    vetoCouncilVotingPower,
  ]);
  const isLoading =
    liquidTreasury.loading ||
    delegatedSupply.isLoading ||
    activeSupply.isLoading ||
    averageTurnout.isLoading ||
    daoTokenPriceHistoricalDataLoading ||
    daoTopTokenHolderExcludingTheDaoLoading ||
    isVetoCouncilLoading;

  if (isLoading) {
    return (
      <div className={`h-80 w-full ${className || ""}`}>
        <SkeletonRow className="h-70 w-full" />
      </div>
    );
  }
  let chartData: ChartDataItem[] = [];
  if (!mocked) {
    chartData = [
      {
        id: "liquidTreasury",
        name: "Liquid Treasury",
        type: BarChartEnum.REGULAR,
        value: Number(liquidTreasury.data?.[0]?.totalAssets || 0),
        customColor: "#EC762EFF",
        displayValue:
          Number(liquidTreasury.data?.[0]?.totalAssets || 0) > 10000
            ? undefined
            : "<$10,000",
      },
      {
        id: "delegatedSupply",
        name: "Delegated Supply",
        type: BarChartEnum.STACKED,
        stackedValues: [
          {
            value:
              Number(
                formatEther(
                  BigInt(delegatedSupply.data?.currentDelegatedSupply || "0"),
                ),
              ) * lastPrice,
            label: "Other Delegations",
            color: "#EC762ECC",
          },
          {
            value: vetoCouncilVotingPower
              ? Number(formatEther(BigInt(vetoCouncilVotingPower))) * lastPrice
              : 0,
            label: "Veto Council",
            color: "#EC762E9F",
          },
        ],
      },
      {
        id: "activeSupply",
        name: "Active Supply",
        type: BarChartEnum.REGULAR,
        customColor: "#EC762EE6",
        value:
          Number(formatEther(BigInt(activeSupply.data?.activeSupply || "0"))) *
          lastPrice,
      },
      {
        id: "averageTurnout",
        name: "Average Turnout",
        type: BarChartEnum.REGULAR,
        customColor: "#EC762EB3",
        value:
          Number(
            formatEther(
              BigInt(averageTurnout.data?.currentAverageTurnout || "0"),
            ),
          ) * lastPrice,
      },
      {
        id: "topTokenHolder",
        name: "Top Holder",
        type: BarChartEnum.REGULAR,
        customColor: "#EC762E80",
        value:
          Number(
            formatEther(
              BigInt(daoTopTokenHolderExcludingTheDao?.balance || "0"),
            ),
          ) * lastPrice,
      },
    ];
  } else {
    chartData = mockedAttackCostBarData as ChartDataItem[];
  }
  return (
    <div className={`relative w-full ${className || ""}`}>
      {mocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/5 backdrop-blur-[6px]" />
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          barSize={isMobile ? 30 : 40}
          margin={{ top: 20 }}
        >
          <XAxis
            dataKey="name"
            height={60}
            tick={(props) => <CustomXAxisTick {...props} />}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={(props) => <CustomYAxisTick {...props} />} hide />
          <Tooltip content={<CustomTooltip />} cursor={false} />

          <Bar dataKey="value" stackId="stack" radius={[4, 4, 4, 4]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.customColor} />
            ))}
            <LabelList
              content={(props) => <RegularLabel {...props} data={chartData} />}
            />
          </Bar>

          {chartData.some(
            (item) =>
              item.type === BarChartEnum.STACKED && item.stackedValues?.length,
          ) &&
            chartData
              .find((item) => item.type === BarChartEnum.STACKED)
              ?.stackedValues?.map((_, index) => (
                <Bar
                  key={`stacked-bar-${index}`}
                  dataKey={`stackedValues[${index}].value`}
                  stackId="stack"
                  radius={[
                    index ===
                    (chartData.find(
                      (item) => item.type === BarChartEnum.STACKED,
                    )?.stackedValues?.length || 0) -
                      1
                      ? 4
                      : 0,
                    index ===
                    (chartData.find(
                      (item) => item.type === BarChartEnum.STACKED,
                    )?.stackedValues?.length || 0) -
                      1
                      ? 4
                      : 0,
                    index ===
                    (chartData.find(
                      (item) => item.type === BarChartEnum.STACKED,
                    )?.stackedValues?.length || 0) -
                      1
                      ? 0
                      : 0,
                    index ===
                    (chartData.find(
                      (item) => item.type === BarChartEnum.STACKED,
                    )?.stackedValues?.length || 0) -
                      1
                      ? 0
                      : 0,
                  ]}
                >
                  {chartData.map((entry, cellIndex) => (
                    <Cell
                      key={`cell-${cellIndex}`}
                      fill={entry.stackedValues?.[index]?.color || "#EC762E"}
                    />
                  ))}
                  {index ===
                    (chartData.find(
                      (item) => item.type === BarChartEnum.STACKED,
                    )?.stackedValues?.length || 0) -
                      1 && (
                    <LabelList
                      content={(props) => (
                        <StackedLabel {...props} data={chartData} />
                      )}
                    />
                  )}
                </Bar>
              ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const getStackedTotal = (item: ChartDataItem) => {
  if (item.type === BarChartEnum.STACKED && item.stackedValues?.length) {
    return item.stackedValues.reduce((sum, sv) => sum + sv.value, 0);
  }
  return item.value || 0;
};

type CustomBarLabelConfig = Omit<LabelProps, "ref"> & {
  data: ChartDataItem[];
};

const RegularLabel = (props: CustomBarLabelConfig) => {
  const { x, y, value, data, index = 0, width } = props;
  const item = data[index];

  if (item.type === BarChartEnum.STACKED) return null;

  const centerX = Number(x) + Number(width) / 2;

  return (
    <text
      x={centerX}
      y={Number(y)}
      dy={-6}
      fill="#FAFAFA"
      fontSize={12}
      fontWeight={500}
      textAnchor="middle"
      className="text-xs font-medium"
    >
      {item?.displayValue || `$${formatNumberUserReadable(Number(value))}`}
    </text>
  );
};

const StackedLabel = (props: CustomBarLabelConfig) => {
  const { x, y, data, index = 0, width } = props;
  const item = data[index];

  if (item.type !== BarChartEnum.STACKED || !item.stackedValues?.length)
    return null;

  const centerX = Number(x) + Number(width) / 2;
  const total = getStackedTotal(item);

  return (
    <text
      x={centerX}
      y={Number(y)}
      dy={-6}
      fill="#FAFAFA"
      fontSize={12}
      fontWeight={500}
      textAnchor="middle"
      className="text-xs font-medium"
    >
      ${formatNumberUserReadable(total)}
    </text>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload: ChartDataItem;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!(active && payload && payload.length)) return null;

  const item = payload[0].payload as ChartDataItem;

  return (
    <div className="flex flex-col rounded-lg border border-[#27272A] bg-[#09090b] p-3 text-black shadow-md">
      <p className="flex pb-2 text-xs font-medium leading-[14px] text-neutral-50">
        {label}
      </p>
      {item.type === BarChartEnum.STACKED && item.stackedValues ? (
        <>
          {item.stackedValues
            .filter((item) => item.value !== 0)
            .map((barStacked, index) => (
              <p key={index} className="flex gap-1.5 text-sm text-neutral-50">
                <strong>
                  {barStacked.label}: $
                  {Math.round(barStacked.value).toLocaleString()}
                </strong>
              </p>
            ))}
        </>
      ) : (
        <p className="flex gap-1.5 text-sm text-neutral-50">
          <strong>
            {item.displayValue ||
              `$${item.value && Math.round(item.value).toLocaleString()}`}
          </strong>
        </p>
      )}
    </div>
  );
};

interface AxisTickProps {
  x: number;
  y: number;
  payload: {
    value: string | number;
  };
}

const CustomYAxisTick = (props: AxisTickProps) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dx={-10}
        textAnchor="end"
        fill="#777"
        fontSize={10}
        className="font-medium"
      >
        ${formatNumberUserReadable(Number(payload.value))}
      </text>
    </g>
  );
};

const CustomXAxisTick = ({ x, y, payload }: AxisTickProps) => {
  const words = String(payload.value).split(" ");
  const firstLine = words[0];
  const secondLine = words.slice(1).join(" ");

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="middle"
        fill="#A1A1AA"
        className="text-[12px] font-medium leading-4 sm:text-xs"
      >
        {firstLine}
      </text>
      {secondLine && (
        <text
          x={0}
          y={0}
          dy={28}
          textAnchor="middle"
          fill="#A1A1AA"
          className="text-[12px] font-medium leading-4 sm:text-xs"
        >
          {secondLine}
        </text>
      )}
    </g>
  );
};
