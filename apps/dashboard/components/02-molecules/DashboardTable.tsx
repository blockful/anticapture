"use client";

import React, { useContext, useEffect, useReducer, useState } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { DashboardDao, dashboardData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TheTable, ArrowState } from "@/components/01-atoms";
import { DaoDataContext } from "@/components/contexts/dao-data-provider";
import { AppleIcon } from "../01-atoms/icons/AppleIcon";
import { formatNumberUserReadble } from "@/lib/client/utils";
import { DaoName } from "@/lib/types/daos";

const sortingByAscendingOrDescendingNumber = (
  rowA: Row<DashboardDao>,
  rowB: Row<DashboardDao>,
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

const daoDetails: Record<DaoName, { icon: React.ReactNode; tooltip: string }> =
  {
    [DaoName.UNISWAP]: {
      icon: <AppleIcon className="h-5 w-5" />,
      tooltip: "Total current value of tokens in circulation",
    },
    [DaoName.ENS]: {
      icon: undefined,
      tooltip: "",
    },
  };

interface State {
  data: DashboardDao[];
}

enum ActionType {
  UPDATE_METRIC = "UPDATE_METRIC",
}

type Action = {
  type: ActionType.UPDATE_METRIC;
  payload: DashboardDao & { index: number };
};

const initialState: State = {
  data: dashboardData,
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
                delegatedSupply: action.payload.delegatedSupply,
                profitability: action.payload.profitability,
                delegatesToPass: action.payload.delegatesToPass,
              }
            : item,
        ),
      };

    default:
      return state;
  }
}

export const DashboardTable = () => {
  const { daoData } = useContext(DaoDataContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isCurrentValueArrowState, setCurrentValueArrowState] =
    useState<ArrowState>(ArrowState.DEFAULT);
  const [isVariationArrowState, setVariationArrowState] = useState<ArrowState>(
    ArrowState.DEFAULT,
  );

  useEffect(() => {
    const daoName = (daoData && daoData.id) || DaoName.UNISWAP;
  }, [daoData]);

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

  const dashboardColumns: ColumnDef<DashboardDao>[] = [
    {
      accessorKey: "#",
      cell: ({ row }) => {
        return (
          <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto text-[#fafafa]">
            {row.index + 1}
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
              setVariationArrowState(ArrowState.DEFAULT);
              toggleArrowState(
                isCurrentValueArrowState,
                setCurrentValueArrowState,
              );
            }}
          >
            #
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
      accessorKey: "dao",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const details = dao ? daoDetails["UNI"] : null;
        return (
          <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto text-[#fafafa]">
            {details && details.icon}
            {dao}
          </p>
        );
      },
      header: "DAO",
    },
    {
      accessorKey: "delegatedSupply",
      cell: ({ row }) => {
        const delegatedSupply: number = row.getValue("delegatedSupply");
        return (
          <div className="flex items-center justify-center text-center">
            {delegatedSupply && formatNumberUserReadble(delegatedSupply)}
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
              setVariationArrowState(ArrowState.DEFAULT);
              toggleArrowState(
                isCurrentValueArrowState,
                setCurrentValueArrowState,
              );
            }}
          >
            Delegated Supply
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
      accessorKey: "profitability",
      cell: ({ row }) => {
        const profitability: number = row.getValue("profitability");
        return (
          <div className="flex items-center justify-center text-center">
            {profitability && formatNumberUserReadble(profitability)}
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
              setVariationArrowState(ArrowState.DEFAULT);
              toggleArrowState(
                isCurrentValueArrowState,
                setCurrentValueArrowState,
              );
            }}
          >
            Profitability
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
      accessorKey: "delegatesToPass",
      cell: ({ row }) => {
        const delegatesToPass: number = row.getValue("delegatesToPass");
        return (
          <div className="flex items-center justify-center text-center">
            {delegatesToPass && formatNumberUserReadble(delegatesToPass)}
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
              setVariationArrowState(ArrowState.DEFAULT);
              toggleArrowState(
                isCurrentValueArrowState,
                setCurrentValueArrowState,
              );
            }}
          >
            Delegates To Pass
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

    // {
    //   accessorKey: "metric",
    //   cell: ({ row }) => {
    //     const metric: string = row.getValue("metric");
    //     const details = metric ? metricDetails[metric] : null;
    //     return (
    //       <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto text-[#fafafa]">
    //         {details && details.icon}
    //         {metric}
    //         {details && <TooltipInfo text={details.tooltip} />}
    //       </p>
    //     );
    //   },
    //   header: "Metrics",
    // },
    // {
    //   accessorKey: "average",
    //   cell: ({ row }) => {
    //     const average: number = row.getValue("average");
    //     return (
    //       <div className="flex items-center justify-center text-center">
    //         {average && formatNumberUserReadble(average)}
    //       </div>
    //     );
    //   },
    //   header: ({ column }) => {
    //     return (
    //       <Button
    //         variant="ghost"
    //         className="w-full"
    //         onClick={() => {
    //           column.toggleSorting(column.getIsSorted() === "asc");
    //           setVariationArrowState(ArrowState.DEFAULT);
    //           toggleArrowState(
    //             isCurrentValueArrowState,
    //             setCurrentValueArrowState,
    //           );
    //         }}
    //       >
    //         Average
    //         <ArrowUpDown
    //           props={{
    //             className: "ml-2 h-4 w-4",
    //           }}
    //           activeState={isCurrentValueArrowState}
    //         />
    //       </Button>
    //     );
    //   },
    //   enableSorting: true,
    //   sortingFn: sortingByAscendingOrDescendingNumber,
    // },
    // {
    //   accessorKey: "variation",
    //   cell: ({ row }) => {
    //     const variation: string = row.getValue("variation");

    //     return (
    //       <p
    //         className={`flex items-center justify-center gap-1 text-center ${Number(variation) > 0 ? "text-[#4ade80]" : Number(variation) < 0 ? "text-red-500" : ""}`}
    //       >
    //         {Number(variation) > 0 ? (
    //           <ChevronUp className="h-4 w-4 text-[#4ade80]" />
    //         ) : Number(variation) < 0 ? (
    //           <ChevronDown className="h-4 w-4 text-red-500" />
    //         ) : null}
    //         {variation}%
    //       </p>
    //     );
    //   },
    //   header: ({ column }) => {
    //     return (
    //       <Button
    //         variant="ghost"
    //         className="w-full"
    //         onClick={() => {
    //           column.toggleSorting(column.getIsSorted() === "asc");
    //           setCurrentValueArrowState(ArrowState.DEFAULT);
    //           toggleArrowState(isVariationArrowState, setVariationArrowState);
    //         }}
    //       >
    //         Variation
    //         <ArrowUpDown
    //           activeState={isVariationArrowState}
    //           props={{ className: "ml-2 h-4 w-4" }}
    //         />
    //       </Button>
    //     );
    //   },
    // },
  ];

  return (
    <TheTable
      columns={dashboardColumns}
      data={state.data}
      withPagination={true}
      withSorting={true}
    />
  );
};
