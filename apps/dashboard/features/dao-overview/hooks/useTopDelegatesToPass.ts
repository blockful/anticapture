import { TokenHolder } from "@/features/holders-and-delegates";
import { useMemo } from "react";

export const useTopDelegatesToPass = ({
  holders,
  quorumValue,
}: {
  holders: { data?: TokenHolder[] | null };
  quorumValue: number | null;
}) => {
  return useMemo(() => {
    if (!holders?.data || !quorumValue) return null;

    const topHolders = holders.data
      .map((h) => ({ balance: Number(h.balance) / 10 ** 18 }))
      .sort((a, b) => b.balance - a.balance);

    let balance = 0;
    let count = 0;
    for (const h of topHolders) {
      balance += h.balance;
      count++;
      if (balance >= quorumValue) break;
    }

    return balance < quorumValue ? "20+" : count;
  }, [holders?.data, quorumValue]);
};
