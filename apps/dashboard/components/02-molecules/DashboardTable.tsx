/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, Row } from "@tanstack/react-table";
import { DashboardDao, dashboardData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  TheTable,
  ArrowState,
} from "@/components/01-atoms";
import { formatNumberUserReadable } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import { fetchDelegatedSupply } from "@/lib/server/backend";
import Image, { StaticImageData } from "next/image";
import ENSLogo from "@/public/logo/ENS.png";
import UNILogo from "@/public/logo/UNI.png";
import { TimeInterval } from "@/lib/enums/TimeInterval";

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

const daoDetails: Record<
  DaoIdEnum,
  { icon: StaticImageData; tooltip: string }
> = {
  [DaoIdEnum.UNISWAP]: {
    icon: UNILogo,
    tooltip: "Total current value of tokens in circulation.",
  },
  [DaoIdEnum.ENS]: {
    icon: ENSLogo,
    tooltip: "",
  },
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

export const DashboardTable = ({ days }: { days: TimeInterval }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();

  useEffect(() => {
    Object.values(DaoIdEnum).map((daoId, index) => {
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
        <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 overflow-auto px-4 text-[#fafafa]">
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
        const details = dao ? daoDetails[dao as DaoIdEnum] : null;
        return (
          <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto text-[#fafafa]">
            {details && (
              <Image src={details.icon} alt={"OK"} width={24} height={24} />
            )}
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
            {`${delegatedSupply && formatNumberUserReadable(delegatedSupply)}`}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Delegated Supply ({days})
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
    //         {profitability && formatNumberUserReadable(profitability)}
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
    //         {delegatesToPass && formatNumberUserReadable(delegatesToPass)}
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
