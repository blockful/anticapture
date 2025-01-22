/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, Row } from "@tanstack/react-table";
import { DashboardDao, dashboardData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  AppleIcon,
  ArrowUpDown,
  TheTable,
  ArrowState,
  TimeInterval,
} from "@/components/01-atoms";
import { formatNumberUserReadble } from "@/lib/client/utils";
import { DaoId } from "@/lib/types/daos";
import { fetchDelegatedSupply } from "@/lib/server/backend";

interface State {
  data: DashboardDao[];
}

enum ActionType {
  UPDATE_DELEGATED_SUPPLY = "DELEGATED SUPPLY",
}

type Action = {
  type: ActionType.UPDATE_DELEGATED_SUPPLY;
  payload: {
    index: number;
    delegatedSupply: string;
  };
};

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

const daoDetails: Record<DaoId, { icon: React.ReactNode; tooltip: string }> = {
  [DaoId.UNISWAP]: {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in circulation",
  },
  // [DaoId.ENS]: {
  //   icon: undefined,
  //   tooltip: "",
  // },
};

const initialState: State = {
  data: dashboardData,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.UPDATE_DELEGATED_SUPPLY:
      const index = action.payload.index;
      const data = [
        ...state.data.slice(0, action.payload.index),
        {
          ...state.data[index],
          delegatedSupply: action.payload.delegatedSupply,
        },
        ...state.data.slice(index + 1, state.data.length),
      ];
      return {
        ...state,
        data,
      };
    default:
      return state;
  }
}

export const DashboardTable = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const days = TimeInterval.THIRTY_DAYS;

  useEffect(() => {
    Object.values(DaoId).map((daoId, index) => {
      fetchDelegatedSupply({ daoId, days }).then((result) => {
        result &&
          dispatch({
            type: ActionType.UPDATE_DELEGATED_SUPPLY,
            payload: {
              index: index,
              delegatedSupply: String(
                BigInt(result.currentDelegatedSupply) / BigInt(10 ** 18),
              ),
            },
          });
      });
    });
  }, [days]);

  const dashboardColumns: ColumnDef<DashboardDao>[] = [
    {
      accessorKey: "#",
      cell: ({ row }) => (
        <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 overflow-auto text-[#fafafa]">
          {row.index + 1}
        </p>
      ),
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          #
          <ArrowUpDown
            props={{
              className: "h-4 w-4",
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
      sortingFn: (rowA, rowB) => rowA.index - rowB.index,
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
            {`${delegatedSupply && formatNumberUserReadble(delegatedSupply)}`}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Delegated Supply (30d)
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
    // {
    //   accessorKey: "profitability",
    //   cell: ({ row }) => {
    //     const profitability: number = row.getValue("profitability");
    //     return (
    //       <div className="flex items-center justify-center text-center">
    //         {profitability && formatNumberUserReadble(profitability)}
    //       </div>
    //     );
    //   },
    //   header: ({ column }) => (
    //     <Button
    //       variant="ghost"
    //       className="w-full"
    //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //     >
    //       Profitability
    //       <ArrowUpDown
    //         props={{
    //           className: "ml-2 h-4 w-4",
    //         }}
    //         activeState={
    //           column.getIsSorted() === "asc"
    //             ? ArrowState.UP
    //             : column.getIsSorted() === "desc"
    //               ? ArrowState.DOWN
    //               : ArrowState.DEFAULT
    //         }
    //       />
    //     </Button>
    //   ),
    //   enableSorting: true,
    //   sortingFn: sortingByAscendingOrDescendingNumber,
    // },
    // {
    //   accessorKey: "delegatesToPass",
    //   cell: ({ row }) => {
    //     const delegatesToPass: number = row.getValue("delegatesToPass");
    //     return (
    //       <div className="flex items-center justify-center text-center">
    //         {delegatesToPass && formatNumberUserReadble(delegatesToPass)}
    //       </div>
    //     );
    //   },
    //   header: ({ column }) => (
    //     <Button
    //       variant="ghost"
    //       className="w-full"
    //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //     >
    //       Delegates to pass
    //       <ArrowUpDown
    //         props={{
    //           className: "ml-2 h-4 w-4",
    //         }}
    //         activeState={
    //           column.getIsSorted() === "asc"
    //             ? ArrowState.UP
    //             : column.getIsSorted() === "desc"
    //               ? ArrowState.DOWN
    //               : ArrowState.DEFAULT
    //         }
    //       />
    //     </Button>
    //   ),
    //   enableSorting: true,
    //   sortingFn: sortingByAscendingOrDescendingNumber,
    // },
  ];

  const handleRowClick = (row: DashboardDao) => {
    row.dao && router.push(`/${row.dao.toLowerCase()}`);
  };

  return (
    <TheTable
      columns={dashboardColumns}
      data={state.data}
      withPagination={true}
      withSorting={true}
      onRowClick={handleRowClick}
    />
  );
};
