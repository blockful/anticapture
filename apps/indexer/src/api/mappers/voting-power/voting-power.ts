import { z } from "@hono/zod-openapi";
import { votingPowerHistory } from "ponder:schema";

import { DBDelegation } from "../transactions";
import { DBTransfer } from "../transfers";

export type DBHistoricalVotingPower = typeof votingPowerHistory.$inferSelect;
export type DBHistoricalVotingPowerWithRelations = DBHistoricalVotingPower & {
  delegations: DBDelegation | null;
  transfers: DBTransfer | null;
};

export const HistoricalVotingPowerRequestSchema = z.object({
  skip: z.coerce
    .number()
    .int()
    .min(0, "Skip must be a non-negative integer")
    .optional()
    .default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be a positive integer")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(10),
  orderBy: z.enum(["timestamp", "delta"]).optional().default("timestamp"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  fromDate: z
    .string()
    .optional()
    .transform((val) => Number(val)),
  toDate: z
    .string()
    .optional()
    .transform((val) => Number(val)),
  fromValue: z.string().optional(),
  toValue: z.string().optional(),
});

export type HistoricalVotingPowerRequest = z.infer<
  typeof HistoricalVotingPowerRequestSchema
>;

export const HistoricalVotingPowerResponseSchema = z.object({
  items: z.array(
    z.object({
      transactionHash: z.string(),
      daoId: z.string(),
      accountId: z.string(),
      votingPower: z.string(),
      delta: z.string(),
      timestamp: z.string(),
      logIndex: z.number(),
      delegation: z
        .object({
          from: z.string(),
          value: z.string(),
          to: z.string(),
          previousDelegate: z.string().nullable(),
        })
        .nullable(),
      transfer: z
        .object({
          value: z.string(),
          from: z.string(),
          to: z.string(),
        })
        .nullable(),
    }),
  ),
  totalCount: z.number(),
});

export type HistoricalVotingPowerResponse = z.infer<
  typeof HistoricalVotingPowerResponseSchema
>;

export const HistoricalVotingPowerMapper = (
  p: DBHistoricalVotingPowerWithRelations[],
  totalCount: number,
): HistoricalVotingPowerResponse => {
  return {
    items: p.map((p) => ({
      transactionHash: p.transactionHash,
      daoId: p.daoId,
      accountId: p.accountId,
      votingPower: p.votingPower.toString(),
      delta: p.delta.toString(),
      timestamp: p.timestamp.toString(),
      logIndex: p.logIndex,
      delegation: p.delegations
        ? {
            from: p.delegations.delegatorAccountId,
            value: p.delegations.delegatedValue.toString(),
            to: p.delegations.delegateAccountId,
            previousDelegate: p.delegations.previousDelegate,
          }
        : null,
      transfer: p.transfers
        ? {
            value: p.transfers.amount.toString(),
            from: p.transfers.fromAccountId,
            to: p.transfers.toAccountId,
          }
        : null,
    })),
    totalCount: Number(totalCount),
  };
};
