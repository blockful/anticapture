import { z } from "@hono/zod-openapi";

import { transfer } from "@/database";
import {
  AddressSchema,
  OrderDirectionSchema,
  addressOutputField,
  affectedSupplyFlagsFields,
  bigIntRangeQueryParams,
  daoIdField,
  decimalStringField,
  earliestLatestDateRangeQueryParams,
  logIndexField,
  paginatedListResponse,
  paginationQueryParams,
  txHashField,
  unixSecondsStringField,
} from "../shared";

export type DBTransfer = typeof transfer.$inferSelect;

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
    ...paginationQueryParams(),
    orderBy: z
      .enum(["timestamp", "amount"])
      .optional()
      .default("timestamp")
      .openapi({
        description: "Field used to sort transfers.",
        example: "timestamp",
      }),
    orderDirection: OrderDirectionSchema.optional(),
    from: AddressSchema.optional(),
    to: AddressSchema.optional(),
    ...earliestLatestDateRangeQueryParams("transfer"),
    ...bigIntRangeQueryParams("transfer amount"),
  })
  .openapi("TransfersRequestQuery");

export type TransfersRequest = z.infer<typeof TransfersRequestQuerySchema> &
  z.infer<typeof TransfersRequestRouteSchema>;

export const TransferResponseSchema = z
  .object({
    transactionHash: txHashField(),
    daoId: daoIdField(),
    tokenId: addressOutputField("Token contract address."),
    amount: decimalStringField(
      "Transferred amount encoded as a decimal string.",
    ),
    fromAccountId: addressOutputField("Sender address."),
    toAccountId: addressOutputField("Recipient address."),
    timestamp: unixSecondsStringField("Transfer"),
    logIndex: logIndexField(),
    ...affectedSupplyFlagsFields("transfer"),
  })
  .openapi("Transfer");

export const TransfersResponseSchema = paginatedListResponse(
  TransferResponseSchema,
  "Total number of matching transfers.",
).openapi("TransfersResponse");

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
