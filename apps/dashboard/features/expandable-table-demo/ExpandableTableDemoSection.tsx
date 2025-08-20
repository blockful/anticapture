"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TheTable } from "@/shared/components/tables/TheTable";
import {
  SupplyLabel,
  SupplyType,
} from "@/shared/components/badges/SupplyLabel";
import {
  TransactionData,
  sampleTransactionData,
} from "@/shared/constants/mocked-data/sample-expandable-data";
import { ArrowUp, ArrowDown, ExternalLink, ArrowRight } from "lucide-react";

export const ExpandableTableDemoSection = () => {
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
        size: 162,
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
        header: "Date",
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return date ? (
            <span className="text-secondary text-sm">{date}</span>
          ) : null;
        },
        size: 100,
      },
      {
        accessorKey: "from",
        header: "From",
        cell: ({ getValue }) => {
          const from = getValue<string>();
          return (
            <div className="flex items-center gap-2">
              <span className="text-secondary text-sm">{from}</span>
              <ExternalLink className="text-secondary h-3 w-3 opacity-50" />
            </div>
          );
        },
        size: 150,
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
        size: 150,
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
      <div className="bg-surface-default p-4">
        <TheTable
          columns={columns}
          data={sampleTransactionData}
          enableExpanding={true}
          getSubRows={(row) => row.subRows}
          withSorting={true}
          withPagination={false}
          isTableSmall={true}
          className="border-0"
          showParentDividers={true}
        />
      </div>
    </div>
  );
};
