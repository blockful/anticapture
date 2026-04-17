import { getAddress, isAddress, isHex } from "viem";
import { z } from "zod";

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
