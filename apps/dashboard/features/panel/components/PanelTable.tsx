"use client";

import React, { useEffect, useRef } from "react";
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
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { formatUnits } from "viem";
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
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

type PanelDao = {
  dao: string;
  inAnalysis?: boolean;
};

type PanelTableProps = {
  currency: "usd" | "eth";
};
export const PanelTable = ({ currency }: PanelTableProps) => {
  const { isMobile } = useScreenSize();
  // Create refs to store the actual numeric values for sorting
  // const liquidTreasuryValues = useRef<Record<number, number>>({}); // commented for depoly
  const circSupplyValues = useRef<Record<number, number>>({});
  const delegSupplyValues = useRef<Record<number, number>>({});
  const activeSupplyValues = useRef<Record<number, number>>({});
  const quorumGapValues = useRef<Record<number, number>>({});

  // Create initial data
  const data = Object.values(DaoIdEnum).map((daoId, index) => ({
    id: index,
    dao: daoId,
  }));

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
    const decimals = daoConfigByDaoId[daoId].decimals;
    const circulatingSupplyInUsd = circulatingSupply
      ? Number(formatUnits(BigInt(circulatingSupply), decimals)) * (price ?? 0)
      : null;

    const valueToShow =
      cellCurrency === "usd" ? circulatingSupplyInUsd : circulatingSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (circulatingSupply && valueToShow != null) {
        const numericValue =
          cellCurrency === "usd"
            ? (valueToShow as number)
            : Number(formatUnits(BigInt(valueToShow as string), decimals));
        circSupplyValues.current[rowIndex] = numericValue;
      } else {
        // Clear value when data is not available
        delete circSupplyValues.current[rowIndex];
      }
    }, [circulatingSupply, valueToShow, cellCurrency, rowIndex, decimals]);

    if (isLoading || !circulatingSupply || valueToShow == null) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end w-full"
          className="h-5 w-full max-w-20 lg:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      cellCurrency === "usd"
        ? (valueToShow as number)
        : Number(formatUnits(BigInt(valueToShow as string), decimals)),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {cellCurrency === "usd" ? "$" : ""}
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
    const decimals = daoConfigByDaoId[daoId].decimals;
    const delegatedSupplyInUsd = delegatedSupply
      ? Number(formatUnits(BigInt(delegatedSupply), decimals)) *
        (tokenData?.price ?? 0)
      : null;

    const valueToShow =
      cellCurrency === "usd" ? delegatedSupplyInUsd : delegatedSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (delegatedSupply && valueToShow != null) {
        const numericValue =
          cellCurrency === "usd"
            ? (valueToShow as number)
            : Number(formatUnits(BigInt(valueToShow as string), decimals));
        delegSupplyValues.current[rowIndex] = numericValue;
      } else {
        // Clear value when data is not available
        delete delegSupplyValues.current[rowIndex];
      }
    }, [delegatedSupply, valueToShow, cellCurrency, rowIndex, decimals]);

    if (isLoading || !delegatedSupply || valueToShow == null) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end w-full"
          className="h-5 w-full max-w-20 lg:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      cellCurrency === "usd"
        ? (valueToShow as number)
        : Number(formatUnits(BigInt(valueToShow as string), decimals)),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {cellCurrency === "usd" ? "$" : ""}
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
    const decimals = daoConfigByDaoId[daoId].decimals;
    const activeSupply = activeSupplyData?.activeSupply;
    const activeSupplyInUsd = activeSupply
      ? Number(formatUnits(BigInt(activeSupply), decimals)) *
        (tokenData?.price ?? 0)
      : null;

    const valueToShow =
      cellCurrency === "usd" ? activeSupplyInUsd : activeSupply;

    // Store the numeric value in the ref when data changes
    useEffect(() => {
      if (activeSupply && valueToShow != null) {
        const numericValue =
          cellCurrency === "usd"
            ? (valueToShow as number)
            : Number(formatUnits(BigInt(valueToShow as string), decimals));
        activeSupplyValues.current[rowIndex] = numericValue;
      }
    }, [activeSupply, valueToShow, cellCurrency, rowIndex, decimals]);

    if (isLoading || !activeSupply || valueToShow == null) {
      return (
        <SkeletonRow
          parentClassName="flex animate-pulse justify-end w-full"
          className="h-5 w-full max-w-20 lg:max-w-32"
        />
      );
    }

    const formattedValue = formatNumberUserReadable(
      cellCurrency === "usd"
        ? (valueToShow as number)
        : Number(formatUnits(BigInt(valueToShow as string), decimals)),
    );

    return (
      <div className="text-secondary flex w-full items-center justify-end py-3 text-end text-sm font-normal">
        {cellCurrency === "usd" ? "$" : ""}
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
          parentClassName="flex animate-pulse justify-end w-full"
          className="h-5 w-full max-w-20 lg:max-w-32"
        />
      );
    }

    if (quorumGap === null || quorumGap === undefined || isNaN(quorumGap)) {
      return (
        <div className="text-secondary flex w-full items-center justify-end text-end text-sm font-normal">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>No recent proposals in the last 90 days</p>
              </div>
            }
          >
            <div className="text-secondary decoration-secondary/20 hover:decoration-primary flex w-full items-center justify-end py-3 text-end text-sm font-normal underline decoration-dashed underline-offset-[6px] transition-colors duration-300">
              No Activity
            </div>
          </Tooltip>
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
          <div className="scrollbar-none group flex w-full items-center gap-3 space-x-1 overflow-auto">
            <div className={"flex w-full gap-3"}>
              <div className="flex w-full items-center gap-1.5">
                <DaoAvatarIcon
                  daoId={dao as DaoIdEnum}
                  className="size-icon-sm"
                />
                {!isMobile && (
                  <TitleUnderlined
                    className="text-primary whitespace-nowrap text-sm font-medium"
                    title={daoConfigByDaoId[dao as DaoIdEnum].name}
                  />
                )}
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
        const chainName =
          daoConfigByDaoId[dao as DaoIdEnum].daoOverview.chain.name;

        return (
          <div className="scrollbar-none flex w-full items-center gap-3 space-x-1 overflow-auto">
            <div className={"flex w-full items-center gap-3"}>
              <Tooltip
                tooltipContent={
                  <div>
                    <p>{chainName}</p>
                  </div>
                }
              >
                <ChainIcon className="size-6 cursor-pointer rounded-full" />
              </Tooltip>
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
      header: () => (
        <div className="w-full justify-end px-0 text-left">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>
                  Resilience Stages are based on governance mechanisms, using
                  the riskiest exposed vector as the criterion for progression.
                </p>
              </div>
            }
          >
            <TitleUnderlined title="Stage" className="text-left" />
          </Tooltip>
        </div>
      ),
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
              daoId={daoId}
              riskAreas={riskAreas.risks}
              variant={RiskAreaCardEnum.PANEL_TABLE}
              className="flex w-full flex-row gap-1"
              withTitle={false}
            />
          </div>
        );
      },
      header: () => (
        <div className="w-full justify-end px-0 text-left">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>
                  Assess critical vulnerabilities in the DAO&apos;s governance
                  setup. Each item highlights a specific attack exposure,
                  showing which issues are resolved and which still expose the
                  system to threats.
                </p>
              </div>
            }
          >
            <TitleUnderlined title="Attack Exposure" className="text-left" />
          </Tooltip>
        </div>
      ),
      meta: {
        columnClassName: "w-56",
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
        <div className="flex w-full justify-end gap-2 px-0 text-right">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>
                  Total number of tokens currently in circulation and available
                  to the market, excluding tokens locked, burned, or held in
                  treasury.
                </p>
              </div>
            }
          >
            <TitleUnderlined title="Circ. Supply" />
          </Tooltip>
          <Button
            variant="ghost"
            className="text-secondary hover:bg-surface-hover group justify-end px-1 py-1 text-right"
            onClick={() => column.toggleSorting()}
          >
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
        </div>
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
        <div className="flex w-full justify-end gap-2 px-0 text-right">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>
                  Total amount of voting power that has been delegated to
                  addresses, whether or not it was used in recent votes.
                </p>
              </div>
            }
          >
            <TitleUnderlined title="Deleg. Supply" />
          </Tooltip>
          <Button
            variant="ghost"
            className="text-secondary hover:bg-surface-hover group justify-end px-1 py-1 text-right"
            onClick={() => column.toggleSorting()}
          >
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
        </div>
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
        <div className="flex w-full justify-end gap-2 px-0 text-right">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>Voting power used in governance over the last 90 days.</p>
              </div>
            }
          >
            <TitleUnderlined title="Active Supply" />
          </Tooltip>
          <Button
            variant="ghost"
            className="text-secondary hover:bg-surface-hover group justify-end px-1 py-1 text-right"
            onClick={() => column.toggleSorting()}
          >
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
        </div>
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
        <div className="flex w-full justify-end gap-2 px-0 text-right">
          <Tooltip
            tooltipContent={
              <div className="text-center">
                <p>
                  Shows how much participation was above or below the quorum in
                  the last 90d. Calculated as (average turnout ÷ quorum) − 1
                </p>
              </div>
            }
          >
            <TitleUnderlined title="Quorum Gap" />
          </Tooltip>
          <Button
            variant="ghost"
            className="text-secondary hover:bg-surface-hover group justify-end px-1 py-1 text-right"
            onClick={() => column.toggleSorting()}
          >
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

  return (
    <Table
      columns={panelColumns}
      data={data}
      withSorting={true}
      stickyFirstColumn={true}
      href={(row: PanelDao) => (row.dao ? `/${row.dao.toLowerCase()}` : null)}
      disableRowClick={(row: PanelDao) =>
        !!daoConfigByDaoId[row.dao as DaoIdEnum].disableDaoPage
      }
    />
  );
};

const TitleUnderlined = ({
  title,
  className,
}: {
  title: string;
  className?: string;
}) => {
  return (
    <h4
      className={cn(
        "text-table-header decoration-secondary/20 group-hover:decoration-primary hover:decoration-primary whitespace-nowrap text-right underline decoration-dashed underline-offset-[6px] transition-colors duration-300",
        className,
      )}
    >
      {title}
    </h4>
  );
};
