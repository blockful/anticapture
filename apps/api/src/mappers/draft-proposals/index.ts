import { z } from "@hono/zod-openapi";

import { AddressSchema } from "../shared";

const ActionSchema = z.record(z.string(), z.unknown()).openapi("DraftAction", {
  description: "A single proposal action encoded as a JSON object.",
});

export const DraftResponseSchema = z
  .object({
    id: z.string(),
    daoId: z.string(),
    author: z.string().openapi({ format: "ethereum-address" }),
    title: z.string(),
    discussionUrl: z.string(),
    body: z.string(),
    actions: z.array(ActionSchema),
    createdAt: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({
        type: "string",
        format: "bigint",
        description:
          "Creation timestamp in Unix milliseconds, as a decimal string.",
      }),
    updatedAt: z
      .bigint()
      .transform((val) => val.toString())
      .openapi({
        type: "string",
        format: "bigint",
        description:
          "Last-updated timestamp in Unix milliseconds, as a decimal string.",
      }),
  })
  .openapi("DraftProposal");

export type DraftResponse = z.infer<typeof DraftResponseSchema>;

export const DraftListResponseSchema = z
  .object({ items: z.array(DraftResponseSchema) })
  .openapi("DraftProposalList");

export const ListDraftsQuerySchema = z
  .object({
    address: AddressSchema,
  })
  .openapi("ListDraftsQuery", {
    description: "Query parameters for listing draft proposals.",
  });

export const DraftParamsSchema = z
  .object({
    id: z.string().openapi({ description: "UUID of the draft." }),
  })
  .openapi("DraftParams");

export const CreateDraftBodySchema = z
  .object({
    id: z
      .string()
      .uuid()
      .openapi({ description: "Client-generated UUID for the draft." }),
    address: AddressSchema,
    title: z.string().default(""),
    discussionUrl: z.string().default(""),
    body: z.string().default(""),
    actions: z.array(ActionSchema).default([]),
  })
  .openapi("CreateDraftBody");

export const UpdateDraftBodySchema = z
  .object({
    address: AddressSchema,
    title: z.string().optional(),
    discussionUrl: z.string().optional(),
    body: z.string().optional(),
    actions: z.array(ActionSchema).optional(),
  })
  .openapi("UpdateDraftBody");

export const DeleteDraftQuerySchema = z
  .object({
    address: AddressSchema,
  })
  .openapi("DeleteDraftQuery", {
    description: "Query parameters for deleting a draft proposal.",
  });
