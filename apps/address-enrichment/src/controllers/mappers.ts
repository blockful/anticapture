import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

const AddressSchema = z
  .string()
  .refine((addr) => isAddress(addr, { strict: false }))
  .transform((addr) => addr.toLowerCase());

export const AddressRequestSchema = z.object({
  address: AddressSchema,
});

export const AddressResponseSchema = z.object({
  address: z.string().transform((addr) => getAddress(addr)),
  isContract: z.boolean(),
  arkham: z
    .object({
      entity: z.string().nullable(),
      entityType: z.string().nullable(),
      label: z.string().nullable(),
      twitter: z.string().nullable(),
    })
    .nullable(),
  ens: z
    .object({
      name: z.string().nullable(),
      avatar: z.string().nullable(),
      banner: z.string().nullable(),
    })
    .nullable(),
});

export const AddressesRequestSchema = z.object({
  addresses: z.union([
    AddressSchema.transform((addr) => [addr]),
    z
      .array(AddressSchema)
      .min(1, "At least one address is required")
      .max(100, "Maximum 100 addresses per request"),
  ]),
});

export const AddressesResponseSchema = z.object({
  results: z.array(AddressResponseSchema),
});
