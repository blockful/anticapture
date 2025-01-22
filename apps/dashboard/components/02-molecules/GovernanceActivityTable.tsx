"use client";

import React, { useEffect, useReducer } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GovernanceActivity, governanceActivityData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  AppleIcon,
  ArrowUpDown,
  TimeInterval,
  TheTable,
  TooltipInfo,
  ArrowState,
} from "@/components/01-atoms";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";
import { formatNumberUserReadble } from "@/lib/client/utils";
import { DaoId } from "@/lib/types/daos";
import { fetchActiveSupply, fetchAverageTurnout, fetchProposals, fetchTreasury, fetchVotes } from "@/lib/server/backend";

const sortingByAscendingOrDescendingNumber = (
  rowA: Row<GovernanceActivity>,
  rowB: Row<GovernanceActivity>,
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
  Treasury: {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in circulation",
  },
  Proposals: {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in circulation",
  },
  "Active Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens delegated",
  },
  Votes: {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in circulation",
  },
  "Average Turnout": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in CEX",
  },
};

interface State {
  data: GovernanceActivity[];
}

enum ActionType {
  UPDATE_METRIC = "UPDATE_METRIC",
}

type Action = {
  type: ActionType.UPDATE_METRIC;
  payload: { index: number; average: string; variation: string };
};

const initialState: State = {
  data: governanceActivityData,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.UPDATE_METRIC:
      console.log(action.payload.index);
      const data = [
        ...state.data.slice(0,action.payload.index), 
          {
            ...state.data[action.payload.index], 
            average: action.payload.average,
            variation: action.payload.variation
          },
       ...state.data.slice(action.payload.index+1, state.data.length)
      ];
      console.log(data);
      return {
        ...state,
        data,
      };
    default:
      return state;
  }
}

export const GovernanceActivityTable = ({
  days,
}: {
  days: TimeInterval;
}) => {
  const { daoData } = useDaoDataContext();
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    const daoId = (daoData && daoData.id) || DaoId.UNISWAP;

    fetchTreasury({ daoId, days: days }).then(
      (result) => {
        result &&
          dispatch({
            type: ActionType.UPDATE_METRIC,
            payload: {
              index: 0,
              average: String(
                BigInt(result.currentTreasury) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
            },
          });
      },
    );

    fetchActiveSupply({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 2,
            average: String(BigInt(result.currentActiveSupply) / BigInt(10 ** 18)),
            variation: formatVariation(result.changeRate),
          },
        });
    });

    fetchProposals({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 1,
            average: result.currentProposalsLaunched,
            variation: formatVariation(result.changeRate),
          },
        });
    });

    fetchVotes({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 3,
            average: result.currentVotes,
            variation: formatVariation(result.changeRate),
          },
        });
    });

    fetchAverageTurnout({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 4,
            average: String(BigInt(result.currentAverageTurnout) / BigInt(10 ** 18)),
            variation: formatVariation(result.changeRate),
          },
        });
    });

  }, [daoData, days]);

  const governanceActivityColumns: ColumnDef<GovernanceActivity>[] = [
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
      accessorKey: "average",
      cell: ({ row }) => {
        const average: number = row.getValue("average");
        return (
          <div className="flex items-center justify-center text-center">
            {average && formatNumberUserReadble(average)}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Average
          <ArrowUpDown
            props={{
              className: "ml-2 h-4 w-4",
            }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
      sortingFn: sortingByAscendingOrDescendingNumber,
    },
    {
      accessorKey: "variation",
      cell: ({ row }) => {
        const variation: string = row.getValue("variation");

        return (
          <p
            className={`flex items-center justify-center gap-1 text-center ${
              Number(variation) > 0
                ? "text-[#4ade80]"
                : Number(variation) < 0
                  ? "text-red-500"
                  : ""
            }`}
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Variation
          <ArrowUpDown
            props={{ className: "ml-2 h-4 w-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
      sortingFn: sortingByAscendingOrDescendingNumber,
    },
  ];

  return (
    <TheTable
      columns={governanceActivityColumns}
      data={state.data}
      withPagination={true}
      withSorting={true}
    />
  );
};
