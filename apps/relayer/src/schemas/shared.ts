import { z } from "zod";

export const HexSchema = z.string().regex(/^0x[0-9a-fA-F]+$/, "Invalid hex");
export const AddressSchema = HexSchema.length(42).openapi({
  example: "0x323a76393544d5ecca80cd6ef2a560c6a395b7e3",
});
export const Bytes32Schema = HexSchema.length(66);
export const TxHashSchema = HexSchema.length(66);

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    code: z.string(),
  })
  .openapi("ErrorResponse");
