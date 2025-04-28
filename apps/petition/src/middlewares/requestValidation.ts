import { z } from "zod";
import { Context } from "hono";
import { ParsedFormValue } from "hono/types";
import { isAddress, isHex } from "viem";

export const validatePetitionSignature = z.object({
  message: z.string(),
  signature: z.string().refine((sig) => isHex(sig), {
    message: "Invalid signature",
  }),
  accountId: z.string().refine((id) => isAddress(id), {
    message: "Invalid account",
  }),
});

/**
 * Middleware to validate petition signature request body
 * @returns Hono middleware handler
 */
export const petitionSignatureValidator = async (
  value: Record<string, ParsedFormValue | ParsedFormValue[]>,
  c: Context,
) => {
  const result = validatePetitionSignature.safeParse(value);
  if (result.success) return result.data

  return c.json(
    {
      error: "Invalid request body",
      details: result.error.format()
    },
    400
  );
};
