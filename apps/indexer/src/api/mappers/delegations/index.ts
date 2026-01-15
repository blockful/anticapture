import { z } from "@hono/zod-openapi";
import { delegation } from "ponder:schema";
import { getAddress, isAddress } from "viem";

type DBDelegation = typeof delegation.$inferSelect;

export const DelegationsRequestParamsSchema = z.object({
  address: z.string().refine((val) => isAddress(val, { strict: false })),
});

export const DelegationsRequestQuerySchema = z.object({
  delegateAddressIn: z
    .union([
      z
        .string()
        .refine((val) => isAddress(val, { strict: false }))
        .transform((val) => [getAddress(val)]),
      z.array(
        z
          .string()
          .refine((val) => isAddress(val, { strict: false }))
          .transform((val) => getAddress(val)),
      ),
    ])
    .optional(),
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
  fromValue: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  toValue: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  orderBy: z.enum(["timestamp"]).optional().default("timestamp"),
});

export type DelegationsRequestQuery = z.infer<
  typeof DelegationsRequestQuerySchema
>;

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

const DelegationMapper = (d: DBDelegation): DelegationItem => {
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
};

export const DelegationResponseMapper = (d: {
  items: DBDelegation[];
  totalCount: number;
}): DelegationsResponse => {
  return {
    items: d.items.map(DelegationMapper),
    totalCount: d.totalCount,
  };
};
