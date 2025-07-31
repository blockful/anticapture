import { z } from "@hono/zod-openapi";
import { delegation, transfer, votingPowerHistory } from "ponder:schema";
import { isAddress } from "viem";
import { DaysEnum, DaysOpts } from "@/lib/enums";

export type DBTransfer = typeof transfer.$inferSelect;
export type DBDelegation = typeof delegation.$inferSelect;
export type DBVotingPowerHistory = typeof votingPowerHistory.$inferSelect;
export type DBVotingPowerHistoryWithRelations = DBVotingPowerHistory & {
  transfers: DBTransfer[];
  delegations: DBDelegation[];
};

export const VotingPowerHistoriesRequestSchema = z.object({
  addresses: z
    .array(z.string())
    .optional()
    .refine((addresses) => {
      if (addresses) {
        return (
          addresses.length > 0 &&
          addresses.every((address) => isAddress(address))
        );
      }
      return true;
    })
    .or(
      z
        .string()
        .optional()
        .refine((addr) => {
          if (addr) return isAddress(addr);
          return true;
        })
        .transform((addr) => (addr ? [addr] : undefined)),
    ),
  days: z
    .enum(DaysOpts)
    .default("7d")
    .transform((val) => DaysEnum[val]),
  skip: z.coerce.number().default(0),
  limit: z.coerce.number().default(10),
  orderBy: z.enum(["timestamp", "delta"]).default("timestamp"),
  orderDirection: z.enum(["asc", "desc"]).default("asc"),
});

export type VotingPowerHistoriesRequest = z.infer<
  typeof VotingPowerHistoriesRequestSchema
>;

export const TransferSchema = z.object({
  amount: z.string(),
  from: z.string(),
  to: z.string(),
  timestamp: z.string(),
  tokenId: z.string(),
  transactionHash: z.string(),
});

export const DelegationSchema = z.object({
  delegator: z.string(),
  delegatedValue: z.string(),
  previousDelegate: z.string(),
  delegate: z.string(),
  transactionHash: z.string(),
});

export const VotingPowerHistoryItemSchema = z.object({
  delta: z.number(),
  timestamp: z.number(),
  votingPower: z.string(),
  account: z.string(),
  transfer: TransferSchema.optional(),
  delegation: DelegationSchema.optional(),
});

export type VotingPowerHistoryItem = z.infer<
  typeof VotingPowerHistoryItemSchema
>;

export const VotingPowerHistoriesResponseSchema = z.object({
  items: z.array(VotingPowerHistoryItemSchema),
});

export type VotingPowerHistoriesResponse = z.infer<
  typeof VotingPowerHistoriesResponseSchema
>;

export const VotingPowerHistoryMapper = {
  toApi: (p: DBVotingPowerHistoryWithRelations): VotingPowerHistoryItem => {
    const transfer = p.transfers.length > 0 ? p.transfers[0] : undefined;
    const delegation = p.delegations.length > 0 ? p.delegations[0] : undefined;

    return {
      delta: Number(p.delta),
      timestamp: Number(p.timestamp),
      votingPower: p.votingPower.toString(),
      account: p.accountId,
      transfer: transfer && {
        amount: transfer.amount.toString(),
        from: transfer.fromAccountId,
        to: transfer.toAccountId,
        timestamp: transfer.timestamp.toString(),
        tokenId: transfer.tokenId,
        transactionHash: transfer.transactionHash,
      },
      delegation: delegation && {
        delegator: delegation.delegatorAccountId,
        delegatedValue: delegation.delegatedValue.toString(),
        previousDelegate: delegation.previousDelegate,
        delegate: delegation.delegateAccountId,
        transactionHash: delegation.transactionHash,
      },
    };
  },
};
