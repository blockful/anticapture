import { z } from "@hono/zod-openapi";

import { addressOutputField } from "../shared";

export const AddressLabelCategorySchema = z
  .enum(["treasury", "vesting"])
  .openapi("AddressLabelCategory", {
    description: "High-level category derived from the address label.",
  });

export const AddressLabelItemSchema = z
  .object({
    address: addressOutputField("Labeled address."),
    label: z.string().openapi({
      description: "Human-readable label for the address.",
      example: "Foundation Vesting Wallet",
    }),
    category: AddressLabelCategorySchema,
  })
  .openapi("AddressLabelItem", {
    description: "Known DAO-labeled address with its category.",
  });

export const AddressLabelsResponseSchema = z
  .object({
    items: z.array(AddressLabelItemSchema),
  })
  .openapi("AddressLabelsResponse", {
    description: "Labeled treasury and vesting addresses for the DAO.",
  });

export type AddressLabelItem = z.infer<typeof AddressLabelItemSchema>;
export type AddressLabelsResponse = z.infer<typeof AddressLabelsResponseSchema>;
