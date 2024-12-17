"use client";

import { useContext, useEffect, useReducer } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { TokenDistribution, tokenDistributionData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import { TheTable } from "@/components/01-atoms";
import {
  DaoName,
  fetchDelegatedSupply,
  fetchTotalSupply,
} from "@/lib/server/backend";
import { DaoDataContext } from "@/components/contexts/dao-data-provider";

export const tokenDistributionColumns: ColumnDef<TokenDistribution>[] = [
  {
    accessorKey: "metric",
    cell: ({ row }) => {
      const metric: string = row.getValue("metric");
      return (
        <p className="scrollbar-none flex max-w-40 items-center space-x-1 overflow-auto">
          {metric}
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
          {amount}
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
          Amount | %
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "variation",
    cell: ({ row }) => {
      const variation: string = row.getValue("variation");

      return <p className="mr-4 text-center">{variation}</p>;
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

export const TokenDistributionTable = () => {
  const { daoData } = useContext(DaoDataContext);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const daoName = (daoData && daoData.id) || DaoName.UNISWAP;

    fetchTotalSupply({ daoName, timeInterval: "7d" })
      .then((result) => {
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 0,
            amount: String(
              BigInt(result.currentTotalSupply) / BigInt(10 ** 18),
            ),
            variation: result.changeRate,
          },
        });
      })
      .finally(() =>
        dispatch({
          type: ActionType.STOP_LOADING,
          payload: { key: "totalSupply" },
        }),
      );

    fetchDelegatedSupply({ daoName, timeInterval: "7d" })
      .then((result) => {
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 1,
            amount: String(
              BigInt(result.currentDelegatedSupply) / BigInt(10 ** 18),
            ),
            variation: `${Number(Number(result.changeRate) * 100).toFixed(2)}%`,
          },
        });
      })
      .finally(() =>
        dispatch({
          type: ActionType.STOP_LOADING,
          payload: { key: "delegatedSupply" },
        }),
      );
  }, [daoData]);

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
