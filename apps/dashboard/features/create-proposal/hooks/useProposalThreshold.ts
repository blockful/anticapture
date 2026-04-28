"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { daoPathParamsDaoEnum, type DaoPathParams } from "@anticapture/client";
import { useDao } from "@anticapture/client/hooks";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export type UseProposalThresholdReturn = {
  threshold: bigint | null;
  thresholdFormatted: string | null;
  isLoading: boolean;
};

const supportedDaos: DaoPathParams["dao"][] =
  Object.values(daoPathParamsDaoEnum);

const toDaoPathParam = (daoId: string): DaoPathParams["dao"] | null => {
  const lower = daoId.toLowerCase();
  return supportedDaos.includes(lower as DaoPathParams["dao"])
    ? (lower as DaoPathParams["dao"])
    : null;
};

export function useProposalThreshold(
  daoId: string,
): UseProposalThresholdReturn {
  const daoPathParam = toDaoPathParam(daoId);

  // `useDao` requires a path param even when disabled. Pass the lowercased
  // input through (the cast is safe because the query is gated on
  // `daoPathParam !== null` and won't fire for unsupported daoIds).
  const { data, isLoading } = useDao(
    (daoPathParam ?? daoId.toLowerCase()) as DaoPathParams["dao"],
    { query: { enabled: daoPathParam !== null } },
  );

  return useMemo(() => {
    const raw = data?.proposalThreshold;
    if (!daoPathParam || raw == null) {
      return { threshold: null, thresholdFormatted: null, isLoading };
    }
    const threshold = BigInt(raw);
    const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
    const decimals = daoConfig[daoIdEnum]?.decimals ?? 18;
    const formatted = formatUnits(threshold, decimals);
    return { threshold, thresholdFormatted: formatted, isLoading };
  }, [data, daoPathParam, daoId, isLoading]);
}
