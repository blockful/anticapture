import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { delegation, votingPowerHistory } from "@/database";

import { OrderDirectionSchema } from "../shared";
import { DBTransfer } from "../transfers";

type DBDelegation = typeof delegation.$inferSelect;

export type DBHistoricalVotingPower = typeof votingPowerHistory.$inferSelect;
export type DBHistoricalVotingPowerWithRelations = DBHistoricalVotingPower & {
  delegations: DBDelegation | null;
  transfers: DBTransfer | null;
};

export const HistoricalVotingPowerRequestParamsSchema = z
  .object({
    address: z
      .string()
      .refine((addr) => isAddress(addr, { strict: false }))
      .transform((addr) => getAddress(addr)),
  })
  .openapi("HistoricalVotingPowerRequestParams", {
    description: "Path params for historical voting power queries.",
  });

export const HistoricalVotingPowerRequestQuerySchema = z
  .object({
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
      .max(1000, "Limit cannot exceed 1000")
      .optional()
      .default(10),
    orderBy: z.enum(["timestamp", "delta"]).optional().default("timestamp"),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
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
  })
  .openapi("HistoricalVotingPowerRequestQuery", {
    description:
      "Query params used to page and filter historical voting power deltas.",
  });

export type HistoricalVotingPowerRequest = z.infer<
  typeof HistoricalVotingPowerRequestQuerySchema
>;

export const HistoricalVotingPowerDelegationSchema = z
  .object({
    from: z.string(),
    value: z.string(),
    to: z.string(),
    previousDelegate: z.string().nullable(),
  })
  .openapi("HistoricalVotingPowerDelegation", {
    description:
      "Delegation event associated with a historical voting power row.",
  });

export const HistoricalVotingPowerTransferSchema = z
  .object({
    value: z.string(),
    from: z.string(),
    to: z.string(),
  })
  .openapi("HistoricalVotingPowerTransfer", {
    description:
      "Transfer event associated with a historical voting power row.",
  });

export const HistoricalVotingPowerResponseSchema = z
  .object({
    transactionHash: z.string(),
    daoId: z.string(),
    accountId: z.string(),
    votingPower: z.string(),
    delta: z.string(),
    timestamp: z.string(),
    logIndex: z.number().int(),
    delegation: HistoricalVotingPowerDelegationSchema.nullable(),
    transfer: HistoricalVotingPowerTransferSchema.nullable(),
  })
  .openapi("HistoricalVotingPower", {
    description:
      "Single historical voting power record enriched with delegation and transfer context.",
  });

export const HistoricalVotingPowersResponseSchema = z
  .object({
    items: z.array(HistoricalVotingPowerResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("HistoricalVotingPowersResponse", {
    description: "Paginated historical voting power records.",
  });

export type HistoricalVotingPowerResponse = z.infer<
  typeof HistoricalVotingPowerResponseSchema
>;

export type HistoricalVotingPowersResponse = z.infer<
  typeof HistoricalVotingPowersResponseSchema
>;

export const HistoricalVotingPowerResponseMapper = (
  p: DBHistoricalVotingPowerWithRelations,
): HistoricalVotingPowerResponse => {
  return {
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
  };
};

export const HistoricalVotingPowersResponseMapper = (
  p: DBHistoricalVotingPowerWithRelations[],
  totalCount: number,
): HistoricalVotingPowersResponse => {
  return {
    items: p.map(HistoricalVotingPowerResponseMapper),
    totalCount: Number(totalCount),
  };
};

export const HistoricalVotingPowerGlobalQuerySchema =
  HistoricalVotingPowerRequestQuerySchema.extend({
    address: z
      .string()
      .refine((addr) => isAddress(addr, { strict: false }))
      .transform((addr) => getAddress(addr))
      .optional(),
  }).openapi("HistoricalVotingPowerGlobalQuery", {
    description:
      "Global historical voting power filters, optionally scoped to a single address.",
  });
