import { AverageTurnoutResponse } from "@/shared/hooks";
import { useMemo } from "react";

export const useDaoQuorumStats = ({
  daoData,
  averageTurnout,
}: {
  daoData?: { quorum?: string } | null;
  averageTurnout: {
    data?: AverageTurnoutResponse | null;
  } | null;
}) => {
  return useMemo(() => {
    const quorumValue = daoData?.quorum
      ? Number(daoData.quorum) / 10 ** 18
      : null;
    const turnoutTokens = averageTurnout?.data
      ? Number(averageTurnout.data.currentAverageTurnout) / 10 ** 18
      : null;

    const averageTurnoutPercentAboveQuorum =
      quorumValue && turnoutTokens
        ? (turnoutTokens / quorumValue - 1) * 100
        : 0;

    return { quorumValue, averageTurnoutPercentAboveQuorum };
  }, [daoData?.quorum, averageTurnout?.data]);
};
