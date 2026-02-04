import { SupplyType } from "@/shared/components/badges/SupplyLabel";
import { formatNumberUserReadable } from "@/shared/utils";
import { formatUnits } from "viem";
import { TransactionData } from "@/features/transactions/hooks/useTransactionsTableData";

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
  if (types.length === 0) types.push("Other");
  return types;
};

const toBigIntSafe = (val: string | number | undefined | null): bigint => {
  if (val == null || val === "") return 0n;
  if (typeof val === "bigint") return val;
  if (typeof val === "string") {
    const clean = val.trim();
    if (/^-?\d+$/.test(clean)) return BigInt(clean);
    const num = Number(clean);
    if (!isFinite(num)) return 0n;
    return BigInt(Math.floor(num));
  }
  if (Number.isInteger(val)) return BigInt(val);
  return BigInt(Math.floor(val as number));
};

export const adaptTransactionsToTableData = (
  transactions: GraphTransaction[],
  decimals: number,
): TransactionData[] => {
  return transactions.map((tx, idx) => {
    const affectedSupply = deduceSupplyTypes(tx);

    const transfersAmountRaw =
      tx.transfers?.reduce((acc, t) => acc + Number(t.amount), 0) ?? 0;
    const delegationsAmountRaw =
      tx.delegations?.reduce((acc, d) => acc + Number(d.delegatedValue), 0) ??
      0;

    const amount = formatNumberUserReadable(
      Number(
        formatUnits(
          toBigIntSafe(transfersAmountRaw) + toBigIntSafe(delegationsAmountRaw),
          decimals,
        ),
      ) || 0,
      2,
    );

    // add transfers to subRows also
    const transfersSubRows = tx.transfers?.map((t, tidx) => ({
      id: `${idx + 1}.${tidx + 1}`,
      affectedSupply: ["Other"] as SupplyType[],
      amount: formatNumberUserReadable(
        Number(formatUnits(toBigIntSafe(t.amount || 0), decimals)),
        2,
      ),
      timestamp: t.timestamp,
      from: t.fromAccountId,
      to: t.toAccountId,
    }));
    const delegationsSubRows = tx.delegations?.map((d, didx) => ({
      id: `${idx + 1}.${didx + 1}`,
      affectedSupply: ["Delegation"] as SupplyType[],
      amount: formatNumberUserReadable(
        Number(formatUnits(toBigIntSafe(d.delegatedValue), decimals)) || 0,
        2,
      ),
      timestamp: d.timestamp,
      from: d.delegatorAccountId,
      to: d.delegateAccountId,
    }));
    const subRows = [...transfersSubRows, ...delegationsSubRows].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp),
    );

    return {
      id: String(idx + 1),
      affectedSupply,
      amount: amount,
      timestamp: tx.timestamp,
      from: tx.from,
      to: tx.to,
      txHash: tx.transactionHash,
      subRows: subRows.length > 0 ? subRows : undefined,
    } satisfies TransactionData;
  });
};
