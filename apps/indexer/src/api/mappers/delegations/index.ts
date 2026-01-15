import { z } from "@hono/zod-openapi";
import { isAddress } from "viem";
import { delegation } from "ponder:schema";

type DBDelegation = typeof delegation.$inferSelect;

// where: {
//     daoId: $daoId
//     delegatorAccountId_in: $delegator
//     delegateAccountId: $delegate
//   }

// (
//     where: {
//       delegatorAccountId: $delegator
//       delegateAccountId: $delegate
//       delegatedValue_gte: $minDelta
//       delegatedValue_lte: $maxDelta
//     }
//     orderBy: $orderBy
//     orderDirection: $orderDirection
//     limit: $limit
//     after: $after
//     before: $before
//   ) {

// (where: { delegatorAccountId: $delegator })

export const DelegationsRequestSchema = z.object({
  delegatorAccountId: z.string().refine((val) => isAddress(val)),
  // delegateAccountId: z.string().optional(),
  // minDelta: z.number().optional(),
  // maxDelta: z.number().optional(),

  // pagination
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

  // orderBy: z.string().optional(),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type DelegationsRequest = z.infer<typeof DelegationsRequestSchema>;

// items{
//     delegatorAccountId
//     timestamp
// totalCount
//       }

// items {
//     delegateAccountId
//     delegatedValue
//     timestamp
//     transactionHash
//   }
//   pageInfo {
//     hasNextPage
//     hasPreviousPage
//     startCursor
//     endCursor
//   }

export const DelegationItemSchema = z.object({
  delegatorAccountId: z.string(),
  delegateAccountId: z.string(),
  delegatedValue: z.string(),
  transactionHash: z.string(),
  timestamp: z.string(),
  daoId: z.string(),
  previousDelegate: z.string().nullable(),
  logIndex: z.number(),
  isCex: z.boolean(),
  isDex: z.boolean(),
  isLending: z.boolean(),
  isTotal: z.boolean(),
});

export const DelegationsResponseSchema = z.object({
  items: z.array(DelegationItemSchema),
  totalCount: z.number(),
});

export type DelegationsResponse = z.infer<typeof DelegationsResponseSchema>;
export type DelegationItem = z.infer<typeof DelegationItemSchema>;

export const DelegationMapper = {
  toApi: (d: DBDelegation): DelegationItem => {
    return {
      delegatorAccountId: d.delegatorAccountId,
      delegateAccountId: d.delegateAccountId,
      delegatedValue: d.delegatedValue.toString(),
      transactionHash: d.transactionHash,
      timestamp: d.timestamp.toString(),
      daoId: d.daoId,
      previousDelegate: d.previousDelegate,
      logIndex: d.logIndex,
      isCex: d.isCex,
      isDex: d.isDex,
      isLending: d.isLending,
      isTotal: d.isTotal,
    };
  },
};
