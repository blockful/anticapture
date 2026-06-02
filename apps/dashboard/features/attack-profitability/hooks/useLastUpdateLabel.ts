import { AlertCircle, CheckCircle2 } from "lucide-react";

import { useLastUpdate } from "@anticapture/client/hooks";
import type {
  LastUpdatePathParamsDaoEnumKey,
  LastUpdateQueryParamsChartEnumKey,
} from "@anticapture/client";

import type { DaoIdEnum } from "@/shared/types/daos";
import { formatTimeFromNow } from "@/shared/utils/formatTimeFromNow";

export const useLastUpdateLabel = (
  daoId: DaoIdEnum,
  chart: LastUpdateQueryParamsChartEnumKey,
) => {
  const { data, isLoading, error } = useLastUpdate(
    daoId.toLowerCase() as LastUpdatePathParamsDaoEnumKey,
    {
      chart,
    },
  );

  return {
    label: data ? formatTimeFromNow(new Date(data.lastUpdate)) : null,
    icon: error ? AlertCircle : CheckCircle2,
    isLoading,
    hasData: Boolean(data?.lastUpdate),
  };
};
