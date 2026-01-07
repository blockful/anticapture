import { z } from "@hono/zod-openapi";

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
  delegatorAccountId: z.number().optional(),
  delegateAccountId: z.number().optional(),
  minDelta: z.number().optional(),
  maxDelta: z.number().optional(),

  // pagination
  skip: z.number().optional(),
  limit: z.number().optional(),

  orderBy: z.string().optional(),
  orderDirection: z.string().optional(),
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

export const DelegationsResponseSchema = z.object({
  delegatorAccountId: z.string(),
  delegateAccountId: z.string(),
  delegatedValue: z.string(),
  transactionHash: z.string(),
  timestamp: z.string(),
  totalCount: z.number(),

  skip: z.number(),
  limit: z.number(),
});

export type DelegationsResponse = z.infer<typeof DelegationsResponseSchema>;
