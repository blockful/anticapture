import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { transfer } from "@/database";

export type DBTransfer = typeof transfer.$inferSelect;

export const TransfersRequestRouteSchema = z.object({
  address: z
    .string()
    .refine((addr) => isAddress(addr, { strict: false }))
    .transform((addr) => getAddress(addr)),
});

export const TransfersRequestQuerySchema = z.object({
  limit: z.coerce.number().optional().default(10),
  offset: z.coerce.number().optional().default(0),
  sortBy: z.enum(["timestamp", "amount"]).optional().default("timestamp"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  from: z
    .string()
    .refine((addr) => isAddress(addr, { strict: false }), {
      message: "Invalid address",
    })
    .transform((addr) => getAddress(addr))
    .optional(),
  to: z
    .string()
    .refine((addr) => isAddress(addr, { strict: false }), {
      message: "Invalid address",
    })
    .transform((addr) => getAddress(addr))
    .optional(),
  fromDate: z.coerce.number().optional(),
  toDate: z.coerce.number().optional(),
  fromValue: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  toValue: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
});

export type TransfersRequest = z.infer<typeof TransfersRequestQuerySchema> &
  z.infer<typeof TransfersRequestRouteSchema>;

export const TransferResponseSchema = z.object({
  transactionHash: z.string(),
  daoId: z.string(),
  tokenId: z.string(),
  amount: z.string(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  timestamp: z.string(),
  logIndex: z.number(),
  isCex: z.boolean(),
  isDex: z.boolean(),
  isLending: z.boolean(),
  isTotal: z.boolean(),
});

export const TransfersResponseSchema = z.object({
  items: z.array(TransferResponseSchema),
  totalCount: z.number(),
});

export type TransferResponse = z.infer<typeof TransferResponseSchema>;
export type TransfersResponse = z.infer<typeof TransfersResponseSchema>;

export const TransferMapper = {
  toApi: (t: DBTransfer): TransferResponse => {
    return {
      transactionHash: t.transactionHash,
      daoId: t.daoId,
      tokenId: t.tokenId,
      amount: t.amount.toString(),
      fromAccountId: t.fromAccountId,
      toAccountId: t.toAccountId,
      timestamp: t.timestamp.toString(),
      logIndex: t.logIndex,
      isCex: t.isCex,
      isDex: t.isDex,
      isLending: t.isLending,
      isTotal: t.isTotal,
    };
  },
};
