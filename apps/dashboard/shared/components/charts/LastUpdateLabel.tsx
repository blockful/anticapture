"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useGetLastUpdateQuery } from "@anticapture/graphql-client/hooks";
import { formatTimeAgo } from "@/shared/utils";
import { QueryInput_LastUpdate_Chart } from "@anticapture/graphql-client";

interface LastUpdateLabelProps {
  chart: QueryInput_LastUpdate_Chart;
  className?: string;
}

export const LastUpdateLabel = ({
  chart,
  className = "",
}: LastUpdateLabelProps) => {
  const { data, loading, error } = useGetLastUpdateQuery({
    variables: { chart },
  });

  if (loading || error || !data?.lastUpdate?.lastUpdate) {
    return null;
  }

  const timeAgo = formatTimeAgo(data.lastUpdate.lastUpdate);

  return (
    <div
      className={`flex items-center gap-1.5 text-xs text-zinc-400 ${className}`}
    >
      <ExclamationTriangleIcon className="h-3 w-3" />
      <span>Last updated: {timeAgo}</span>
    </div>
  );
};
