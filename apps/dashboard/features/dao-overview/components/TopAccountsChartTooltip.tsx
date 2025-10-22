"use client";

import React from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import { Address } from "viem";
import { formatNumberUserReadable } from "@/shared/utils";
import { EntityType } from "@/features/holders-and-delegates";
import { useDelegationHistory } from "@/features/holders-and-delegates";
import { useEnsData } from "@/shared/hooks/useEnsData";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: TopAccountChartData }[];
  daoId: DaoIdEnum;
  type: EntityType;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  daoId,
  type,
}) => {
  const data = payload?.[0]?.payload;

  const { data: delegationHistory } = useDelegationHistory({
    daoId,
    delegatorAccountId: type === "tokenHolder" ? data?.address || "" : "",
  });

  const latestDelegation = delegationHistory?.find(
    (entry) =>
      entry.delegate?.id !== "0x0000000000000000000000000000000000000000",
  );

  const { data: latestDelegationData } = useEnsData(
    latestDelegation?.delegate?.id as Address,
  );

  const { totalCount } = useVotingPower({
    daoId,
    address: type === "delegate" ? data?.address || "" : "",
  });

  if (!active || !payload?.length || !data) return null;

  const variation = data.variation?.absoluteChange ?? 0;
  const isPositive = variation >= 0;
  const variationClassName = isPositive
    ? "text-surface-solid-success"
    : "text-surface-solid-error";

  const extraField =
    type === "tokenHolder"
      ? `Delegates to: ${latestDelegationData?.ens || "N/A"}`
      : `Delegators: ${totalCount}`;

  return (
    <div className="bg-surface-background text-secondary flex flex-col gap-1 rounded-md p-2 text-sm">
      <span className="text-primary">{data.name}</span>
      <span>
        Balance: {formatNumberUserReadable(data.balance)} {daoId}
      </span>
      <span>
        Variation:{" "}
        <span className={variationClassName}>
          {formatNumberUserReadable(Math.abs(variation))}
        </span>
      </span>
      <span>{extraField}</span>
    </div>
  );
};
