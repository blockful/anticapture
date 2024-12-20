"use client";

import React, { useContext, useEffect, useReducer, useState } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TokenDistribution, tokenDistributionData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  TimeInterval,
  TheTable,
  TooltipInfo,
  ArrowState,
} from "@/components/01-atoms";
import {
  DaoName,
  fetchCexSupply,
  fetchCirculatingSupply,
  fetchDelegatedSupply,
  fetchTotalSupply,
} from "@/lib/server/backend";
import { DaoDataContext } from "@/components/contexts/dao-data-provider";
import { AppleIcon } from "../01-atoms/icons/AppleIcon";
import { formatNumberUserReadble } from "@/lib/client/utils";

const sortingByAscendingOrDescendingNumber = (
  rowA: Row<TokenDistribution>,
  rowB: Row<TokenDistribution>,
  columnId: string,
) => {
  const a = Number(rowA.getValue(columnId)) ?? 0;
  const b = Number(rowB.getValue(columnId)) ?? 0;
  return a - b;
};

const formatVariation = (rateRaw: string): string =>
  `${Number(Number(rateRaw) * 100).toFixed(2)}`;

const metricDetails: Record<
  string,
  { icon: React.ReactNode; tooltip: string }
> = {
  "Total Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in circulation",
  },
  "Delegated Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens delegated",
  },
  "Circulating Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in circulation",
  },
  "CEX Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in CEX",
  },
  "DEX Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in DEX",
  },
  "Lending Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in lending",
  },
};

interface LoadingState {
  totalSupply: boolean;
  delegatedSupply: boolean;
  circulatingSupply: boolean;
  cexSupply: boolean;
  dexSupply: boolean;
  lendingSupply: boolean;
}

interface State {
  data: TokenDistribution[];
  loadingState: LoadingState;
}

enum ActionType {
  UPDATE_METRIC = "UPDATE_METRIC",
  STOP_LOADING = "STOP_LOADING",
}

type Action =
  | {
      type: ActionType.UPDATE_METRIC;
      payload: { index: number; currentValue: string; variation: string };
    }
  | {
      type: ActionType.STOP_LOADING;
      payload: { key: keyof LoadingState };
    };

const initialState: State = {
  data: tokenDistributionData,
  loadingState: {
    totalSupply: true,
    delegatedSupply: true,
    circulatingSupply: true,
    cexSupply: true,
    dexSupply: true,
    lendingSupply: true,
  },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.UPDATE_METRIC:
      return {
        ...state,
        data: state.data.map((item, index) =>
          index === action.payload.index
            ? {
                ...item,
                currentValue: action.payload.currentValue,
                variation: action.payload.variation,
              }
            : item,
        ),
      };
    case ActionType.STOP_LOADING:
      return {
        ...state,
        loadingState: { ...state.loadingState, [action.payload.key]: false },
      };
    default:
      return state;
  }
}

export const TokenDistributionTable = ({
  timeInterval,
}: {
  timeInterval: TimeInterval;
}) => {
  const { daoData } = useContext(DaoDataContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isCurrentValueArrowState, setCurrentValueArrowState] =
    useState<ArrowState>(ArrowState.DEFAULT);
  const [isVariationArrowState, setVariationArrowState] = useState<ArrowState>(
    ArrowState.DEFAULT,
  );

  useEffect(() => {
    const daoName = (daoData && daoData.id) || DaoName.UNISWAP;

    fetchTotalSupply({ daoName, timeInterval: timeInterval })
      .then((result) => {
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 0,
            currentValue: String(
              BigInt(result.currentTotalSupply) / BigInt(10 ** 18),
            ),
            variation: formatVariation(result.changeRate),
          },
        });
      })
      .finally(() =>
        dispatch({
          type: ActionType.STOP_LOADING,
          payload: { key: "totalSupply" },
        }),
      );

    fetchDelegatedSupply({ daoName, timeInterval: timeInterval })
      .then((result) => {
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 1,
            currentValue: String(
              BigInt(result.currentDelegatedSupply) / BigInt(10 ** 18),
            ),
            variation: formatVariation(result.changeRate),
          },
        });
      })
      .finally(() =>
        dispatch({
          type: ActionType.STOP_LOADING,
          payload: { key: "delegatedSupply" },
        }),
      );

    fetchCirculatingSupply({
      daoName,
      timeInterval: timeInterval,
    })
      .then((result) => {
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 2,
            currentValue: String(
              BigInt(result.currentCirculatingSupply) / BigInt(10 ** 18),
            ),
            variation: formatVariation(result.changeRate),
          },
        });
      })
      .finally(() =>
        dispatch({
          type: ActionType.STOP_LOADING,
          payload: { key: "circulatingSupply" },
        }),
      );

    fetchCexSupply({
      daoName,
      timeInterval: timeInterval,
    })
      .then((result) => {
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 3,
            currentValue: String(
              BigInt(result.currentCexSupply) / BigInt(10 ** 18),
            ),
            variation: formatVariation(result.changeRate),
          },
        });
      })
      .finally(() =>
        dispatch({
          type: ActionType.STOP_LOADING,
          payload: { key: "cexSupply" },
        }),
      );
  }, [daoData, timeInterval]);

  const toggleArrowState = (
    currentState: ArrowState,
    setState: React.Dispatch<React.SetStateAction<ArrowState>>,
  ) => {
    const nextState =
      currentState === ArrowState.DEFAULT
        ? ArrowState.UP
        : currentState === ArrowState.UP
          ? ArrowState.DOWN
          : ArrowState.UP;
    setState(nextState);
  };

  const tokenDistributionColumns: ColumnDef<TokenDistribution>[] = [
    {
      accessorKey: "metric",
      cell: ({ row }) => {
        const metric: string = row.getValue("metric");
        const details = metric ? metricDetails[metric] : null;
        return (
          <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto text-[#fafafa]">
            {details && details.icon}
            {metric}
            {details && <TooltipInfo text={details.tooltip} />}
          </p>
        );
      },
      header: "Metrics",
    },
    {
      accessorKey: "currentValue",
      cell: ({ row }) => {
        const currentValue: number = row.getValue("currentValue");
        return (
          <div className="flex items-center justify-center text-center">
            {currentValue && formatNumberUserReadble(currentValue)}
          </div>
        );
      },
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc");
              toggleArrowState(
                isCurrentValueArrowState,
                setCurrentValueArrowState,
              );
            }}
          >
            Current value (UNI)
            <ArrowUpDown
              props={{
                className: "ml-2 h-4 w-4",
              }}
              activeState={isCurrentValueArrowState}
            />
          </Button>
        );
      },
      enableSorting: true,
      sortingFn: sortingByAscendingOrDescendingNumber,
    },
    {
      accessorKey: "variation",
      cell: ({ row }) => {
        const variation: string = row.getValue("variation");

        return (
          <p
            className={`flex items-center justify-center gap-1 text-center ${Number(variation) > 0 ? "text-[#4ade80]" : Number(variation) < 0 ? "text-red-500" : ""}`}
          >
            {Number(variation) > 0 ? (
              <ChevronUp className="h-4 w-4 text-[#4ade80]" />
            ) : Number(variation) < 0 ? (
              <ChevronDown className="h-4 w-4 text-red-500" />
            ) : null}
            {variation}%
          </p>
        );
      },
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc");
              toggleArrowState(isVariationArrowState, setVariationArrowState);
            }}
          >
            Variation
            <ArrowUpDown
              activeState={isVariationArrowState}
              props={{ className: "ml-2 h-4 w-4" }}
            />
          </Button>
        );
      },
    },
  ];

  return (
    <TheTable
      isLoading={{
        totalSupply: state.loadingState.totalSupply,
        delegatedSupply: state.loadingState.delegatedSupply,
        circulatingSupply: state.loadingState.circulatingSupply,
        cexSupply: state.loadingState.cexSupply,
        dexSupply: state.loadingState.dexSupply,
        lendingSupply: state.loadingState.lendingSupply,
      }}
      columns={tokenDistributionColumns}
      data={state.data}
      withPagination={true}
      filterColumn={"ensNameAndAddress"}
      withSorting={true}
    />
  );
};
