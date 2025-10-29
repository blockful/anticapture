import { useMemo } from "react";

export const useTopDelegatesToPass = ({
  topDelegates,
  quorumValue,
}: {
  topDelegates: { votingPower: string; accountId: string }[];
  quorumValue: number | null;
}) => {
  return useMemo(() => {
    if (!topDelegates || !quorumValue) return null;

    const topHolders = topDelegates
      .map((h) => ({ votingPower: Number(h.votingPower) / 1e18 }))
      .sort((a, b) => b.votingPower - a.votingPower);

    let balance = 0;
    let count = 0;
    for (const h of topHolders) {
      balance += h.votingPower;
      count++;
      if (balance >= quorumValue) break;
    }

    console.log({ quorumValue, balance, count });

    return balance < quorumValue ? "20+" : count;
  }, [topDelegates, quorumValue]);
};
