import { ChartType, useLastUpdate } from "@/shared/hooks/useLastUpdate";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatTimeFromNow } from "@/shared/utils/formatTimeFromNow";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export const useLastUpdateLabel = (daoId: DaoIdEnum, chartType: ChartType) => {
  const { data, isLoading, error } = useLastUpdate(daoId, chartType);

  return {
    label: data ? formatTimeFromNow(new Date(data.lastUpdate)) : null,
    icon: error ? AlertCircle : CheckCircle2,
    isLoading,
    hasData: Boolean(data),
  };
};
