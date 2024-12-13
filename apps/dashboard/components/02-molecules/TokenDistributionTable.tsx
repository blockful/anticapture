"use client";

import { useContext, useEffect, useState } from "react";
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
      console.log("rowMetric", row);
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
          {amount}%
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

export const TokenDistributionTable = () => {
  const { daoData } = useContext(DaoDataContext);
  const [data, setData] = useState<TokenDistribution[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          fetchTotalSupply({
            daoName: (daoData && daoData.id) || DaoName.UNISWAP,
            timeInterval: "7d",
          }),
          fetchDelegatedSupply({
            daoName: (daoData && daoData.id) || DaoName.UNISWAP,
            timeInterval: "7d",
          }),
        ]);

        const totalSupplyResult = results[0];
        const delegatedSupplyResult = results[1];

        const totalSupplyData =
          totalSupplyResult.status === "fulfilled"
            ? totalSupplyResult.value
            : null;
        const delegatedSupplyData =
          delegatedSupplyResult.status === "fulfilled"
            ? delegatedSupplyResult.value
            : null;

        const updatedData: TokenDistribution[] = tokenDistributionData.map(
          (tokenDistributionData) => {
            if (
              tokenDistributionData.metric === "Total Supply" &&
              totalSupplyData
            ) {
              return {
                ...tokenDistributionData,
                amount: totalSupplyData.currentTotalSupply,
                variation: totalSupplyData.changeRate,
              };
            }
            if (
              tokenDistributionData.metric === "Delegated Supply" &&
              delegatedSupplyData
            ) {
              return {
                ...tokenDistributionData,
                amount: delegatedSupplyData.currentDelegatedSupply,
                variation: delegatedSupplyData.changeRate,
              };
            }
            return tokenDistributionData;
          },
        );

        setData(updatedData);
      } catch (error) {
        console.error("Failed to process data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [daoData]);

  return (
    <TheTable
      isLoading={true}
      columns={tokenDistributionColumns}
      data={data}
      withPagination={true}
      filterColumn={"ensNameAndAddress"}
      withSorting={true}
    />
  );
};
