"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TheTable } from "@/shared/components/tables/TheTable";
import {
  SupplyLabel,
  SupplyType,
} from "@/shared/components/badges/SupplyLabel";
import { TransactionData } from "@/shared/constants/mocked-data/sample-expandable-data";
import { ArrowUp, ArrowDown, ExternalLink, ArrowRight } from "lucide-react";
import { useTransactionsTableData } from "@/features/expandable-table-demo";
import { DaoIdEnum } from "@/shared/types/daos";

export const ExpandableTableDemoSection = () => {
  // Using ENS as default dao for demo, can be parameterized later
  const { data: tableData } = useTransactionsTableData({
    daoId: DaoIdEnum.ENS,
    limit: 10,
    offset: 0,
  });
  const columns = useMemo<ColumnDef<TransactionData>[]>(
    () => [
      {
        accessorKey: "affectedSupply",
        header: () => (
          <div className="text-table-header flex h-8 w-full items-center whitespace-nowrap px-2">
            Affected Supply
          </div>
        ),
        cell: ({ getValue }) => {
          const supplies = getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-2">
              {supplies.map((supply, index) => (
                <SupplyLabel key={index} type={supply as SupplyType} />
              ))}
            </div>
          );
        },
        size: 180,
      },
      {
        accessorKey: "amount",
        header: () => (
          <div className="text-table-header flex h-8 w-full items-center justify-end whitespace-nowrap px-2">
            Amount (CAT)
          </div>
        ),
        cell: ({ getValue, row }) => {
          const amount = getValue<number>();
          const hasSubRows =
            row.original.subRows && row.original.subRows.length > 0;

          if (amount === 0) return null;

          return (
            <div className="mr-2 flex w-full items-center justify-end gap-2">
              {hasSubRows ? (
                // If has subRows, show amount with text-secondary
                <span className="text-secondary">
                  {amount.toLocaleString()}
                </span>
              ) : (
                // If no subRows, show amount with arrow and appropriate color
                <div className="flex items-center gap-1">
                  {amount > 0 ? (
                    <>
                      <ArrowUp className="text-success size-3.5" />
                      <span className="text-success">
                        {amount.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="text-error size-3.5" />
                      <span className="text-error">
                        {Math.abs(amount).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        },
        size: 162,
      },
      {
        accessorKey: "date",
        header: () => <div className="w-full">Date</div>,
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return date ? (
            <span className="text-secondary w-full text-sm">{date}</span>
          ) : null;
        },
        size: 162,
      },
      {
        accessorKey: "from",
        header: "From",
        cell: ({ getValue }) => {
          const from = getValue<string>();
          return (
            <div className="flex items-center gap-2">
              <span className="text-secondary text-sm">{from}</span>
            </div>
          );
        },
        size: 162,
      },
      {
        id: "arrow",
        header: "",
        cell: () => <ArrowRight className="h-3 w-3 text-white opacity-50" />,
        size: 40,
      },
      {
        accessorKey: "to",
        header: "To",
        cell: ({ getValue }) => {
          const to = getValue<string>();
          return (
            <div className="flex items-center gap-2">
              <span className="text-secondary text-sm">{to}</span>
            </div>
          );
        },
        size: 162,
      },
      {
        id: "actions",
        header: "",
        cell: () => <ExternalLink className="h-3 w-3 text-white opacity-50" />,
        size: 40,
      },
    ],
    [],
  );

  return (
    <div className="w-full">
      <div className="bg-surface-default flex flex-col p-4">
        <TheTable
          columns={columns}
          data={tableData}
          enableExpanding={true}
          getSubRows={(row) => row.subRows}
          stickyFirstColumn={true}
          withSorting={true}
          withPagination={false}
          isTableSmall={true}
          className="border-0"
          showParentDividers={true}
          mobileTableFixed={true}
        />
      </div>
    </div>
  );
};
