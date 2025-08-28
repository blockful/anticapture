import { TransactionData } from "@/shared/constants/mocked-data/sample-expandable-data";
import { SupplyType } from "@/shared/components/badges/SupplyLabel";
import { formatEther } from "viem";

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

const toShortAddress = (addr: string) =>
  addr?.startsWith("0x") && addr.length > 10
    ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
    : addr;

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

    // Amount is not available at the transaction level. If any transfer exists, sum them; else 0.
    const amountRaw =
      tx.transfers?.reduce((acc, t) => acc + BigInt(t.amount), 0n) ?? 0n;
    const amount = Number(formatEther(amountRaw ?? 0n));

    // SubRows from delegations: each delegation becomes a nested row with affectedSupply Delegation
    const subRows: TransactionData[] | undefined = tx.delegations?.length
      ? tx.delegations.map((d, didx) => ({
          id: `${idx + 1}.${didx + 1}`,
          affectedSupply: ["Delegation"],
          amount: Number(formatEther(BigInt(d.delegatedValue || 0))),
          date: formatRelativeTime(d.timestamp),
          from: toShortAddress(d.delegatorAccountId),
          to: toShortAddress(d.delegateAccountId),
        }))
      : undefined;

    return {
      id: String(idx + 1),
      affectedSupply,
      amount,
      date: formatRelativeTime(tx.timestamp),
      from: toShortAddress(tx.from),
      to: toShortAddress(tx.to),
      subRows,
    } satisfies TransactionData;
  });
};
