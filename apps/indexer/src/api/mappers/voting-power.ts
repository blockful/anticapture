import { z } from "@hono/zod-openapi";
import { votingPowerHistory } from "ponder:schema";

import { DBDelegation, DBTransfer } from "./transactions";
import { isAddress } from "viem";

export type DBVotingPower = typeof votingPowerHistory.$inferSelect;
export type DBVotingPowerWithRelations = DBVotingPower & {
  delegations: DBDelegation | null;
  transfers: DBTransfer | null;
};

export const VotingPowerRequestSchema = z.object({
  account: z.string().refine((addr) => isAddress(addr)),
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
  minDelta: z.string().optional(),
  maxDelta: z.string().optional(),
});

export type VotingPowerRequest = z.infer<typeof VotingPowerRequestSchema>;

export const VotingPowerResponseSchema = z.object({
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

export type VotingPowerResponse = z.infer<typeof VotingPowerResponseSchema>;

export const VotingPowerMapper = (
  p: DBVotingPowerWithRelations[],
  totalCount: number,
): VotingPowerResponse => {
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
    totalCount,
  };
};
