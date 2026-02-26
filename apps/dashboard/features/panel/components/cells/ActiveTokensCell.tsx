"use client";

import { useEffect } from "react";
import { formatUnits } from "viem";

import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";
import {
  ActiveTokensProgress,
  ActiveTokensTooltip,
} from "@/features/panel/components/tooltips/ActiveTokensTooltip";
import { SkeletonRow } from "@/shared/components";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import daoConfigByDaoId from "@/shared/dao-config";
import { useTokenData, useActiveSupply } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { formatNumberUserReadable } from "@/shared/utils";

interface ActiveTokensCellProps {
  daoId: DaoIdEnum;
  onSortValueChange: (value: number | null) => void;
}

const formatSupply = (value: string | undefined, decimals: number): string => {
  if (!value) return "0";
  return formatNumberUserReadable(
    Number(formatUnits(BigInt(value), decimals)),
    2,
  );
};

export const ActiveTokensCell = ({
  daoId,
  onSortValueChange,
}: ActiveTokensCellProps) => {
  const { data: activeSupplyData, isLoading } = useActiveSupply(
    daoId,
    TimeInterval.NINETY_DAYS,
  );
  const { data: tokenData } = useTokenData(daoId, "usd");
  const daoConfig = daoConfigByDaoId[daoId];

  const activePercentage = activeSupplyData?.activeSupply
    ? (Number(activeSupplyData.activeSupply) /
        Number(tokenData?.circulatingSupply)) *
      100
    : null;

  useEffect(() => {
    onSortValueChange(activePercentage ?? null);
  }, [activePercentage, onSortValueChange]);

  if (isLoading) {
    return (
      <SkeletonRow
        parentClassName="flex animate-pulse justify-end w-full"
        className="mx-4 h-5 w-full"
      />
    );
  }

  if (activePercentage === null) {
    return (
      <div className="text-secondary flex w-full items-center justify-end px-4 py-3 text-end text-sm font-normal">
        N/A
      </div>
    );
  }

  const formattedPercentage = formatNumberUserReadable(activePercentage, 1);
  const activeSupplyFormatted = formatSupply(
    activeSupplyData?.activeSupply,
    daoConfig.decimals,
  );
  const circulatingSupplyFormatted = formatSupply(
    tokenData?.circulatingSupply,
    daoConfig.decimals,
  );
  const daoSymbol = daoId.toUpperCase();

  return (
    <Tooltip
      title="Active Tokens In Governance"
      className="text-left lg:w-96"
      triggerClassName="w-full"
      tooltipContent={
        <ActiveTokensTooltip
          activeAmount={`${activeSupplyFormatted} ${daoSymbol}`}
          activePercentage={`${formattedPercentage}%`}
          totalAmount={`${circulatingSupplyFormatted} ${daoSymbol}`}
          barPercentage={activePercentage}
        />
      }
      disableMobileClick
    >
      <ClickableCell
        href={`/${daoId.toLowerCase()}/holders-and-delegates`}
        className="justify-end px-4 py-3 text-end text-sm font-normal"
      >
        <ActiveTokensProgress
          activeAmount={activeSupplyFormatted}
          activePercentage={`${formattedPercentage}%`}
          totalAmount={circulatingSupplyFormatted}
          percentage={activePercentage}
        />
      </ClickableCell>
    </Tooltip>
  );
};
