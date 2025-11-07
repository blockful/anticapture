"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  SkeletonRow,
  RiskAreaCardEnum,
  RiskAreaCardWrapper,
  Button,
} from "@/shared/components";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";
import { useScreenSize, useTokenData, useActiveSupply } from "@/shared/hooks";
import {
  ArrowUpDown,
  ArrowState,
  DaoAvatarIcon,
} from "@/shared/components/icons";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatEther } from "viem";
import { StageTag } from "@/features/resilience-stages/components";
import { Stage } from "@/shared/types/enums/Stage";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import {
  fieldsToArray,
  getDaoStageFromFields,
} from "@/shared/dao-config/utils";
import { getDaoRiskAreas } from "@/shared/utils/risk-analysis";
import { Table } from "@/shared/components/design-system/table/Table";
import { useQuorumGap } from "@/shared/hooks/useQuorumGap";
import { TooltipPlain } from "@/shared/components/tooltips/TooltipPlain";

type PanelDao = {
  dao: string;
  inAnalysis?: boolean;
};

type PanelTableProps = {
  currency: "usd" | "eth";
};
export const PanelTable = ({ currency }: PanelTableProps) => {
  const router = useRouter();
  const { isMobile } = useScreenSize();
  // Create refs to store the actual numeric values for sorting
  const liquidTreasuryValues = useRef<Record<number, number>>({});
  const circSupplyValues = useRef<Record<number, number>>({});
  const delegSupplyValues = useRef<Record<number, number>>({});
  const activeSupplyValues = useRef<Record<number, number>>({});
  const quorumGapValues = useRef<Record<number, number>>({});

  const notOnElectionDaoIds = Object.values(DaoIdEnum).filter(
    (daoId) => daoId !== DaoIdEnum.NOUNS, // TODO remove this when Nouns is fully supported
  );
  // Create initial data
  const data = notOnElectionDaoIds.map((daoId, index) => ({
    id: index,
    dao: daoId,
  }));

  // Liquid Treasury Cell
  const LiquidTreasuryCell = ({
    daoId,
    rowIndex,
    currency: cellCurrency,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
    currency: "usd" | "eth";
  }) => {
    const { data: tokenData, isLoading } = useTokenData(daoId, cellCurrency, {
      revalidateOnMount: true,
      revalidateIfStale: true,
    });
    const treasury = tokenData?.treasury;
    const treasuryInUsd = treasury
      ? Number(formatEther(BigInt(treasury))) * (tokenData?.price ?? 0)
      : null;
    const valueToShow = cellCurrency === "usd" ? treasuryInUsd : treasury;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (treasury && valueToShow != null) {
        const numericValue =
          cellCurrency === "usd"
            ? (valueToShow as number)
            : Number(formatEther(BigInt(valueToShow as string)));
        liquidTreasuryValues.current[rowIndex] = numericValue;
      } else {
        // Clear value when data is not available
        delete liquidTreasuryValues.current[rowIndex];
      }
    }, [treasury, valueToShow, cellCurrency, rowIndex]);

    if (isLoading || !treasury || valueToShow == null) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      cellCurrency === "usd"
        ? (valueToShow as number)
        : Number(formatEther(BigInt(valueToShow as string))),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  // Circ. Supply Cell
  const CircSupplyCell = ({
    daoId,
    rowIndex,
    currency: cellCurrency,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
    currency: "usd" | "eth";
  }) => {
    const { data: tokenData, isLoading } = useTokenData(daoId, "usd", {
      revalidateOnMount: true,
      revalidateIfStale: true,
    });
    const circulatingSupply = tokenData?.circulatingSupply;
    const price = tokenData?.price;

    const circulatingSupplyInUsd = circulatingSupply
      ? Number(formatEther(BigInt(circulatingSupply))) * (price ?? 0)
      : null;

    const valueToShow =
      cellCurrency === "usd" ? circulatingSupplyInUsd : circulatingSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (circulatingSupply) {
        const numericValue = Number(formatEther(BigInt(circulatingSupply)));
        circSupplyValues.current[rowIndex] = numericValue;
      } else {
        // Clear value when data is not available
        delete circSupplyValues.current[rowIndex];
      }
    }, [circulatingSupply, rowIndex]);

    if (isLoading || !circulatingSupply || valueToShow == null) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      cellCurrency === "usd"
        ? (valueToShow as number)
        : Number(formatEther(BigInt(valueToShow as string))),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  // Deleg. Supply Cell (separate from DelegatedSupplyCell which uses refs for sorting)
  const DelegSupplyCell = ({
    daoId,
    rowIndex,
    currency: cellCurrency,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
    currency: "usd" | "eth";
  }) => {
    const { data: tokenData, isLoading } = useTokenData(daoId, cellCurrency, {
      revalidateOnMount: true,
      revalidateIfStale: true,
    });
    const delegatedSupply = tokenData?.delegatedSupply;
    const delegatedSupplyInUsd = delegatedSupply
      ? Number(formatEther(BigInt(delegatedSupply))) * (tokenData?.price ?? 0)
      : null;

    const valueToShow =
      cellCurrency === "usd" ? delegatedSupplyInUsd : delegatedSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (delegatedSupply && valueToShow != null) {
        const numericValue =
          cellCurrency === "usd"
            ? (valueToShow as number)
            : Number(formatEther(BigInt(valueToShow as string)));
        delegSupplyValues.current[rowIndex] = numericValue;
      } else {
        // Clear value when data is not available
        delete delegSupplyValues.current[rowIndex];
      }
    }, [delegatedSupply, valueToShow, cellCurrency, rowIndex]);

    if (isLoading || !delegatedSupply || valueToShow == null) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      cellCurrency === "usd"
        ? (valueToShow as number)
        : Number(formatEther(BigInt(valueToShow as string))),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  // Active Supply Cell
  const ActiveSupplyCell = ({
    daoId,
    rowIndex,
    currency: cellCurrency,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
    currency: "usd" | "eth";
  }) => {
    const { data: activeSupplyData } = useActiveSupply(
      daoId,
      TimeInterval.NINETY_DAYS,
    );

    const { data: tokenData, isLoading } = useTokenData(daoId, cellCurrency, {
      revalidateOnMount: true,
      revalidateIfStale: true,
    });

    const activeSupply = activeSupplyData?.activeSupply;
    const activeSupplyInUsd = activeSupply
      ? Number(formatEther(BigInt(activeSupply))) * (tokenData?.price ?? 0)
      : null;

    const valueToShow =
      cellCurrency === "usd" ? activeSupplyInUsd : activeSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (activeSupply && valueToShow != null) {
        const numericValue =
          cellCurrency === "usd"
            ? (valueToShow as number)
            : Number(formatEther(BigInt(valueToShow as string)));
        activeSupplyValues.current[rowIndex] = numericValue;
      }
    }, [activeSupply, valueToShow, cellCurrency, rowIndex]);

    if (isLoading || !activeSupply || valueToShow == null) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      cellCurrency === "usd"
        ? (valueToShow as number)
        : Number(formatEther(BigInt(valueToShow as string))),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  // Liquid Quorum Gap Cell
  const QuorumGapCell = ({
    daoId,
    rowIndex,
  }: {
    daoId: DaoIdEnum;
    rowIndex: number;
  }) => {
    const { data: quorumGap, isLoading: quorumGapLoading } =
      useQuorumGap(daoId);

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (quorumGap) {
        quorumGapValues.current[rowIndex] = quorumGap;
      } else {
        // Clear value when data is not available
        delete quorumGapValues.current[rowIndex];
      }
    }, [quorumGap, rowIndex]);

    const isLoading = quorumGapLoading;

    if (isLoading) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end pr-4"
          className="h-5 w-full max-w-20 md:max-w-32"
        />
      );
    }

    if (!quorumGap) {
      return (
        <div className="text-secondary flex w-full items-center justify-end text-end text-sm font-normal">
          <TooltipPlain
            triggerComponent={
              <div className="text-secondary decoration-secondary/20 flex w-full items-center justify-end py-3 text-end text-sm font-normal underline decoration-dashed underline-offset-[6px]">
                N/A
              </div>
            }
            contentComponent="No recent proposals in the last 90 days"
          />
        </div>
      );
    }

    const formattedValue = `${formatNumberUserReadable(quorumGap, 1)}%`;

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {formattedValue}
      </div>
    );
  };

  const panelColumns: ColumnDef<PanelDao>[] = [
    {
      accessorKey: "dao",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        return (
          <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto">
            <div className={"flex w-full gap-3"}>
              <div className="flex w-full items-center gap-1.5">
                {!isMobile && (
                  <DaoAvatarIcon
                    daoId={dao as DaoIdEnum}
                    className="size-icon-sm"
                    isRounded
                  />
                )}
                <p className="text-primary text-sm font-medium">
                  {daoConfigByDaoId[dao as DaoIdEnum].name ===
                  daoConfigByDaoId[DaoIdEnum.ENS].name
                    ? "ENS"
                    : daoConfigByDaoId[dao as DaoIdEnum].name}
                </p>
              </div>
            </div>
          </div>
        );
      },
      header: () => <h4 className="text-table-header">DAO</h4>,
      meta: {
        columnClassName: "w-auto",
      },
    },
    {
      accessorKey: "chain",
      cell: ({ row }) => {
        const dao: string = row.getValue("dao");
        const ChainIcon =
          daoConfigByDaoId[dao as DaoIdEnum].daoOverview.chain.icon;
        return (
          <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto">
            <div className={"flex w-full items-center gap-3"}>
              <ChainIcon className="size-6 rounded-full" />
            </div>
          </div>
        );
      },
      header: () => <h4 className="text-table-header">Chain</h4>,
      meta: {
        columnClassName: "w-auto",
      },
    },
    {
      accessorKey: "stage",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const daoConfig = daoConfigByDaoId[daoId];
        if (!daoConfig.governanceImplementation) {
          return (
            <div className="scrollbar-none text-primary flex items-center gap-3 space-x-1 overflow-auto">
              <StageTag
                daoStage={Stage.UNKNOWN}
                tagStage={Stage.UNKNOWN}
                showStageText
              />
            </div>
          );
        }
        const stage = getDaoStageFromFields({
          fields: fieldsToArray(daoConfig.governanceImplementation?.fields),
          noStage: daoConfig.noStage,
        });

        return (
          <div className="scrollbar-none text-primary flex items-center gap-3 space-x-1 overflow-auto">
            <StageTag daoStage={stage} tagStage={stage} showStageText />
          </div>
        );
      },
      header: () => <h4 className="text-table-header">Stage</h4>,
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "riskareas",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const daoRiskAreas = getDaoRiskAreas(daoId);
        const riskAreas = {
          risks: Object.entries(daoRiskAreas).map(([name, info]) => ({
            name,
            level: info.riskLevel,
          })),
        };

        return (
          <div className="scrollbar-none text-primary flex w-full items-center overflow-auto">
            <RiskAreaCardWrapper
              riskAreas={riskAreas.risks}
              variant={RiskAreaCardEnum.PANEL_TABLE}
              className="flex w-full flex-row gap-1"
              withTitle={false}
            />
          </div>
        );
      },
      header: () => <h4 className="text-table-header w">Risk Areas</h4>,
      meta: {
        columnClassName: "w-56",
      },
    },
    {
      accessorKey: "liquidTreasury",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return (
          <LiquidTreasuryCell
            daoId={daoId}
            rowIndex={rowIndex}
            currency={currency}
          />
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-secondary w-full justify-end px-0 text-right"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap text-right">
            Liquid Treasury
          </h4>
          <ArrowUpDown
            props={{
              className: "size-4 shrink-0",
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
      sortingFn: (rowA, rowB) => {
        const indexA = rowA.index;
        const indexB = rowB.index;
        const valueA = liquidTreasuryValues.current[indexA] || 0;
        const valueB = liquidTreasuryValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
      },
    },

    {
      accessorKey: "circSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return (
          <CircSupplyCell
            daoId={daoId}
            rowIndex={rowIndex}
            currency={currency}
          />
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-secondary w-full justify-end px-0 text-right"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap text-right">
            Circ. Supply
          </h4>
          <ArrowUpDown
            props={{
              className: "size-4 shrink-0",
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
      sortingFn: (rowA, rowB) => {
        const indexA = rowA.index;
        const indexB = rowB.index;
        const valueA = circSupplyValues.current[indexA] || 0;
        const valueB = circSupplyValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
      },
    },

    {
      accessorKey: "delegSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return (
          <DelegSupplyCell
            daoId={daoId}
            rowIndex={rowIndex}
            currency={currency}
          />
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-secondary w-full justify-end px-0 text-right"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap text-right">
            Deleg. Supply
          </h4>
          <ArrowUpDown
            props={{
              className: "size-4 shrink-0 ",
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
      sortingFn: (rowA, rowB) => {
        const indexA = rowA.index;
        const indexB = rowB.index;
        const valueA = delegSupplyValues.current[indexA] || 0;
        const valueB = delegSupplyValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
      },
    },
    {
      accessorKey: "activeSupply",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return (
          <ActiveSupplyCell
            daoId={daoId}
            rowIndex={rowIndex}
            currency={currency}
          />
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-secondary w-full justify-end px-0 text-right"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header whitespace-nowrap text-right">
            Active Supply
          </h4>
          <ArrowUpDown
            props={{
              className: "size-4 shrink-0",
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
      sortingFn: (rowA, rowB) => {
        const indexA = rowA.index;
        const indexB = rowB.index;
        const valueA = activeSupplyValues.current[indexA] || 0;
        const valueB = activeSupplyValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
      },
    },
    {
      accessorKey: "quorumGap",
      cell: ({ row }) => {
        const daoId = row.getValue("dao") as DaoIdEnum;
        const rowIndex = row.index;
        return <QuorumGapCell daoId={daoId} rowIndex={rowIndex} />;
      },
      header: ({ column }) => (
        <div className="w-full justify-end px-0 text-right">
          <TooltipPlain
            triggerComponent={
              <Button
                variant="ghost"
                className="text-secondary w-full justify-end px-0 text-right"
                onClick={() => column.toggleSorting()}
              >
                <h4 className="text-table-header decoration-secondary/20 whitespace-nowrap text-right underline decoration-dashed underline-offset-[6px]">
                  Quorum Gap
                </h4>
                <ArrowUpDown
                  props={{
                    className: "size-4 shrink-0",
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
            }
            contentComponent="
Shows how much participation was above or below the quorum in the last 90d. Calculated as (average turnout ÷ quorum) − 1
          "
            className="font-normal"
          />
        </div>
      ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const indexA = rowA.index;
        const indexB = rowB.index;
        const valueA = quorumGapValues.current[indexA] || 0;
        const valueB = quorumGapValues.current[indexB] || 0;
        return valueA - valueB;
      },
      meta: {
        columnClassName: "w-auto",
      },
    },
  ];

  const handleRowClick = (row: PanelDao) => {
    row.dao && router.push(`/${row.dao.toLowerCase()}`);
  };

  return (
    <Table
      columns={panelColumns}
      data={data}
      withSorting={true}
      onRowClick={handleRowClick}
      disableRowClick={(row: PanelDao) =>
        !!daoConfigByDaoId[row.dao as DaoIdEnum].disableDaoPage
      }
    />
  );
};
