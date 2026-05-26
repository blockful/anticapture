import { formatUnits } from "viem";

import daoConfig from "@/shared/dao-config";
import { useDao } from "@anticapture/client/hooks";
import type { DaoIdEnum } from "@/shared/types/daos";
import { type DaoPathParams } from "@anticapture/client";

export function useProposalThreshold(daoId: string) {
  const daoPathParam = daoId.toLowerCase() as DaoPathParams["dao"];

  // `useDao` requires a path param even when disabled. Pass the lowercased
  // input through (the cast is safe because the query is gated on
  // `daoPathParam !== null` and won't fire for unsupported daoIds).
  const { data, isLoading } = useDao(daoPathParam, {
    query: { enabled: daoPathParam !== null },
  });

  const raw = data?.proposalThreshold;
  if (!raw) {
    return { threshold: 0n, thresholdFormatted: null, isLoading };
  }

  const threshold = BigInt(raw);
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const decimals = daoConfig[daoIdEnum]?.decimals ?? 18;
  const formatted = formatUnits(threshold, decimals);
  return { threshold, thresholdFormatted: formatted, isLoading };
}
