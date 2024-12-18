"use client";

import React, { useContext, useEffect, useReducer } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { TokenDistribution, tokenDistributionData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import { TimeInterval, TheTable, TooltipInfo } from "@/components/01-atoms";
import {
  DaoName,
  fetchCirculatingSupply,
  fetchDelegatedSupply,
  fetchTotalSupply,
} from "@/lib/server/backend";
import { DaoDataContext } from "@/components/contexts/dao-data-provider";
import { AppleIcon } from "../01-atoms/icons/AppleIcon";
import { formatNumberUserReadble } from "@/lib/client/utils";

const formatVariation = (rateRaw: string): string =>
  `${Number(Number(rateRaw) * 100).toFixed(2)}%`;

const metricDetails: Record<
  string,
  { icon: React.ReactNode; tooltip: string }
> = {
  "Total Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total amount of tokens in circulation",
  },
  "Delegated Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total amount of tokens delegated",
  },
  "Circulating Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total amount of tokens in circulation",
  },
  "CEX Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total amount of tokens in CEX",
  },
  "DEX Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total amount of tokens in DEX",
  },
  "Lending Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total amount of tokens in lending",
  },
};

export const tokenDistributionColumns: ColumnDef<TokenDistribution>[] = [
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
    accessorKey: "amount",
    cell: ({ row }) => {
      const amount: number = row.getValue("amount");

      return (
        <div className="flex items-center justify-center text-center">
          {formatNumberUserReadble(amount)}
        </div>
      );
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Current value (UNI)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "variation",
    cell: ({ row }) => {
      const variation: string = row.getValue("variation");

      return (
        <p
          className={`flex items-center justify-center gap-1 text-center ${Number(variation) >= 0 ? "text-[#4ade80]" : "text-red-500"}`}
        >
          {Number(variation) >= 0 ? (
            <ChevronUp className="h-4 w-4 text-[#4ade80]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-red-500" />
          )}
          {variation}
        </p>
      );
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Variation
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];

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
      payload: { index: number; amount: string; variation: string };
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
                amount: action.payload.amount,
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

  useEffect(() => {
    const daoName = (daoData && daoData.id) || DaoName.UNISWAP;

    fetchTotalSupply({ daoName, timeInterval: timeInterval })
      .then((result) => {
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 0,
            amount: String(
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
            amount: String(
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
            amount: String(
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
  }, [daoData, timeInterval]);

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
