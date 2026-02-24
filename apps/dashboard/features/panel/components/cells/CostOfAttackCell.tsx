"use client";

import { useEffect } from "react";

import { ClickableCell } from "@/features/panel/components/cells/ClickableCell";
import { useCostOfAttack } from "@/features/panel/hooks";
import { SkeletonRow, BadgeStatus } from "@/shared/components";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";

interface CostOfAttackCellProps {
  daoId: DaoIdEnum;
  onSortValueChange: (value: number | null) => void;
}

export const CostOfAttackCell = ({
  daoId,
  onSortValueChange,
}: CostOfAttackCellProps) => {
  const { costOfAttack, isLoading } = useCostOfAttack(daoId);

  useEffect(() => {
    onSortValueChange(costOfAttack ?? null);
  }, [costOfAttack, onSortValueChange]);

  if (isLoading) {
    return (
      <SkeletonRow
        parentClassName="flex animate-pulse justify-end w-full"
        className="h-5 w-full max-w-20 lg:max-w-32"
      />
    );
  }

  if (costOfAttack === null) {
    return (
      <Tooltip
        tooltipContent={
          <p className="text-secondary text-sm font-normal leading-5">
            Treasury funds are protected by a multisig, so governance control
            cannot directly be used to drain the treasury.
          </p>
        }
        title="Not applicable for this DAO"
        className="text-left"
        triggerClassName="w-full"
      >
        <div className="ml-auto w-min px-2">
          <BadgeStatus children="N/A" variant="dimmed" />
        </div>
      </Tooltip>
    );
  }

  return (
    <ClickableCell
      href={`/${daoId.toLowerCase()}/attack-profitability`}
      className="justify-end py-4 text-end text-sm font-normal"
    >
      <span className="text-secondary px-2">
        ${formatNumberUserReadable(costOfAttack)}
      </span>
    </ClickableCell>
  );
};
