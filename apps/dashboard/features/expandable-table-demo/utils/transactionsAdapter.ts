import { SupplyType } from "@/shared/components/badges/SupplyLabel";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatEther } from "viem";
import { TransactionData } from "@/features/expandable-table-demo/hooks/useTransactionsTableData";

export type GraphTransaction = {
  from: string;
  isCex: boolean;
  isDex: boolean;
  isLending: boolean;
  isTotal: boolean;
  timestamp: string;
  to: string;
  transactionHash: string;
  delegations: Array<{
    daoId: string;
    delegateAccountId: string;
    delegatedValue: string;
    delegatorAccountId: string;
    isCex: boolean;
    isDex: boolean;
    isTotal: boolean;
    isLending: boolean;
    logIndex: number;
    previousDelegate: string;
    timestamp: string;
    transactionHash: string;
  }>;
  transfers: Array<{
    amount: string | number;
    daoId: string;
    fromAccountId: string;
    isCex: boolean;
    isDex: boolean;
    isLending: boolean;
    isTotal: boolean;
    logIndex: number;
    timestamp: string;
    toAccountId: string;
    tokenId: string;
    transactionHash: string;
  }>;
};

const deduceSupplyTypes = (tx: GraphTransaction): SupplyType[] => {
  const types: SupplyType[] = [];
  if (tx.isCex) types.push("CEX");
  if (tx.isDex) types.push("DEX");
  if (tx.isLending) types.push("Lending");
  if (tx.delegations && tx.delegations.length > 0) types.push("Delegation");
  if (types.length === 0) types.push("Others");
  return types;
};

const formatRelativeTime = (timestampSec: string): string => {
  const ts = Number(timestampSec);
  if (!ts) return "";
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - ts);
  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(diff / 86400);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} min ago`;
  return "just now";
};

export const adaptTransactionsToTableData = (
  transactions: GraphTransaction[],
): TransactionData[] => {
  return transactions.map((tx, idx) => {
    const affectedSupply = deduceSupplyTypes(tx);

    const transfersAmountRaw =
      tx.transfers?.reduce((acc, t) => acc + Number(t.amount), 0) ?? 0;
    const delegationsAmountRaw =
      tx.delegations?.reduce((acc, d) => acc + Number(d.delegatedValue), 0) ??
      0;

    const amount = formatNumberUserReadable(
      Number(formatEther(BigInt(transfersAmountRaw))) +
        Number(formatEther(BigInt(delegationsAmountRaw))) || 0,
      2,
    );

    // add transfers to subRows also
    const transfersSubRows = tx.transfers?.map((t, tidx) => ({
      id: `${idx + 1}.${tidx + 1}`,
      affectedSupply: ["Others"] as SupplyType[],
      amount: formatNumberUserReadable(
        Number(formatEther(BigInt(t.amount || 0))),
        2,
      ),
      date: formatRelativeTime(t.timestamp),
      from: t.fromAccountId,
      to: t.toAccountId,
    }));
    const delegationsSubRows = tx.delegations?.map((d, didx) => ({
      id: `${idx + 1}.${didx + 1}`,
      affectedSupply: ["Delegation"] as SupplyType[],
      amount: formatNumberUserReadable(
        Number(formatEther(BigInt(d.delegatedValue))) || 0,
        2,
      ),
      date: formatRelativeTime(d.timestamp),
      from: d.delegatorAccountId,
      to: d.delegateAccountId,
    }));
    const subRows = [...transfersSubRows, ...delegationsSubRows].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return {
      id: String(idx + 1),
      affectedSupply,
      amount: amount,
      date: formatRelativeTime(tx.timestamp),
      from: tx.from,
      to: tx.to,
      txHash: tx.transactionHash,
      subRows: subRows.length > 0 ? subRows : undefined,
    } satisfies TransactionData;
  });
};
