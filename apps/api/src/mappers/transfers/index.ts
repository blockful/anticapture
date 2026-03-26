import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { transfer } from "@/database";
import { OrderDirectionSchema } from "../shared";

export type DBTransfer = typeof transfer.$inferSelect;

const AddressSchema = z
  .string()
  .refine((addr) => isAddress(addr, { strict: false }))
  .transform((addr) => getAddress(addr));

export const TransfersRequestRouteSchema = z
  .object({
    address: AddressSchema.openapi({
      param: {
        description: "Wallet address whose transfers are being queried.",
        example: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
    }),
  })
  .openapi("TransfersRequestParams");

export const TransfersRequestQuerySchema = z
  .object({
    limit: z.coerce.number().int().optional().default(10),
    offset: z.coerce.number().int().optional().default(0),
    orderBy: z.enum(["timestamp", "amount"]).optional().default("timestamp"),
    orderDirection: OrderDirectionSchema.optional(),
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
    fromDate: z.coerce.number().int().optional(),
    toDate: z.coerce.number().int().optional(),
    fromValue: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
    toValue: z
      .string()
      .transform((val) => BigInt(val))
      .optional(),
  })
  .openapi("TransfersRequestQuery");

export type TransfersRequest = z.infer<typeof TransfersRequestQuerySchema> &
  z.infer<typeof TransfersRequestRouteSchema>;

export const TransferResponseSchema = z
  .object({
    transactionHash: z.string(),
    daoId: z.string(),
    tokenId: z.string(),
    amount: z.string(),
    fromAccountId: z.string(),
    toAccountId: z.string(),
    timestamp: z.string(),
    logIndex: z.number().int(),
    isCex: z.boolean(),
    isDex: z.boolean(),
    isLending: z.boolean(),
    isTotal: z.boolean(),
  })
  .openapi("Transfer");

export const TransfersResponseSchema = z
  .object({
    items: z.array(TransferResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("TransfersResponse");

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
