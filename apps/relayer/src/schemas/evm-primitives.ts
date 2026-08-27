import { getAddress, isAddress, isHex, maxUint256 } from "viem";
import { z } from "@hono/zod-openapi";

export const HexSchema = z
  .string()
  .refine(isHex, "Invalid hex")
  .transform((v) => v as `0x${string}`);
export const AddressSchema = z
  .string()
  .refine(isAddress, "Invalid Ethereum address")
  .transform((v) => getAddress(v));
export const Bytes32Schema = HexSchema.refine(
  (v) => v.length === 66,
  "Must be 32 bytes",
);
export const TxHashSchema = HexSchema.refine(
  (v) => v.length === 66,
  "Must be a valid transaction hash",
);

export const DecimalUint256Schema = z
  .string()
  // uint256 fits in 78 decimal digits; without a cap, BigInt() on an
  // arbitrarily long digit string is superlinear CPU on anonymous routes.
  .max(78, "too long for a uint256")
  .regex(/^\d+$/, "must be a non-negative decimal integer")
  .transform((v) => BigInt(v))
  .refine((v) => v <= maxUint256, "exceeds the uint256 maximum");
