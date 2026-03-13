import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { ChartType } from "@/shared/hooks/useLastUpdate";
import { useLastUpdate } from "@/shared/hooks/useLastUpdate";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatTimeFromNow } from "@/shared/utils/formatTimeFromNow";

export const useLastUpdateLabel = (daoId: DaoIdEnum, chartType: ChartType) => {
  const { data, isLoading, error } = useLastUpdate(daoId, chartType);

  return {
    label: data ? formatTimeFromNow(new Date(data.lastUpdate)) : null,
    icon: error ? AlertCircle : CheckCircle2,
    isLoading,
    hasData: Boolean(data),
  };
};
