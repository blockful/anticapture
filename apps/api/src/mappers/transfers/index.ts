import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { transfer } from "@/database";
import {
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
  unixTimestampQueryParam,
} from "../shared";

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
    limit: paginationLimitQueryParam(),
    skip: paginationSkipQueryParam(),
    orderBy: z
      .enum(["timestamp", "amount"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Field used to sort transfers.",
        example: "timestamp",
      }),
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
    fromDate: unixTimestampQueryParam(
      "Earliest transfer timestamp, in Unix seconds.",
    ),
    toDate: unixTimestampQueryParam(
      "Latest transfer timestamp, in Unix seconds.",
    ),
    fromValue: z
      .string()
      .transform((val) => BigInt(val))
      .openapi({
        description: "Minimum transfer amount encoded as a decimal string.",
      })
      .optional(),
    toValue: z
      .string()
      .transform((val) => BigInt(val))
      .openapi({
        description: "Maximum transfer amount encoded as a decimal string.",
      })
      .optional(),
  })
  .openapi("TransfersRequestQuery");

export type TransfersRequest = z.infer<typeof TransfersRequestQuerySchema> &
  z.infer<typeof TransfersRequestRouteSchema>;

export const TransferResponseSchema = z
  .object({
    transactionHash: z.string().openapi({ description: "Transaction hash." }),
    daoId: z.string().openapi({ description: "DAO identifier." }),
    tokenId: z.string().openapi({ description: "Token contract address." }),
    amount: z.string().openapi({
      description: "Transferred amount encoded as a decimal string.",
    }),
    fromAccountId: z.string().openapi({ description: "Sender address." }),
    toAccountId: z.string().openapi({ description: "Recipient address." }),
    timestamp: z.string().openapi({
      description: "Transfer timestamp in Unix seconds as a string.",
      example: "1704067200",
    }),
    logIndex: z.number().int().openapi({
      description: "Log index within the transaction receipt.",
    }),
    isCex: z.boolean().openapi({
      description: "Whether the transfer touched a centralized exchange.",
    }),
    isDex: z.boolean().openapi({
      description: "Whether the transfer touched a decentralized exchange.",
    }),
    isLending: z.boolean().openapi({
      description: "Whether the transfer touched a lending protocol.",
    }),
    isTotal: z.boolean().openapi({
      description: "Whether the transfer counts toward total tracked supply.",
    }),
  })
  .openapi("Transfer");

export const TransfersResponseSchema = z
  .object({
    items: z.array(TransferResponseSchema),
    totalCount: z.number().int().openapi({
      description: "Total number of matching transfers.",
    }),
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
