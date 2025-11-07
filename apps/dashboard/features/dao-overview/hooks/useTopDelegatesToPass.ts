import { useMemo } from "react";
import { parseUnits } from "viem";

export const useTopDelegatesToPass = ({
  topDelegates,
  quorumValue,
  decimals,
}: {
  topDelegates: { votingPower: string; accountId: string }[];
  quorumValue: number | null;
  decimals: number;
}) => {
  return useMemo(() => {
    if (!topDelegates || !quorumValue) return null;

    const topHolders = topDelegates.map((h) => ({
      votingPower: Number(parseUnits(h.votingPower, decimals)),
    }));

    let balance = 0;
    let count = 0;
    for (const h of topHolders) {
      balance += h.votingPower;
      count++;
      if (balance >= quorumValue) break;
    }

    return balance < quorumValue ? "20+" : count;
  }, [topDelegates, quorumValue, decimals]);
};
