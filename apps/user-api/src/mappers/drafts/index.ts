import { z } from "@hono/zod-openapi";

const ActionSchema = z.record(z.string(), z.unknown()).openapi("DraftAction", {
  description: "A single proposal action encoded as a JSON object.",
});

export const DraftResponseSchema = z
  .object({
    id: z.string(),
    daoId: z.string(),
    // Wallet that authored the draft, when known. Null for email/Google
    // authors — display must not assume an address exists.
    authorAddress: z.string().nullable(),
    title: z.string(),
    discussionUrl: z.string(),
    body: z.string(),
    actions: z.array(ActionSchema),
    createdAt: z.number(),
    updatedAt: z.number(),
    // Derived server-side from the session — replaces the dashboard's old
    // author-vs-connected-wallet comparison (Editor vs shared Preview mode).
    isOwner: z.boolean(),
  })
  .openapi("Draft");

export type DraftResponse = z.infer<typeof DraftResponseSchema>;

export const DraftListResponseSchema = z
  .object({ items: z.array(DraftResponseSchema) })
  .openapi("DraftList");

// daoId is a plain filter string, not an authorization boundary — the User
// API deliberately does not duplicate the DAO registry (avoids a sixth
// touchpoint that drifts). Unknown DAOs just produce empty lists.
export const ListDraftsQuerySchema = z
  .object({ daoId: z.string().min(1) })
  .openapi("ListDraftsQuery");

export const DraftParamsSchema = z
  .object({
    id: z.uuid().openapi({ description: "Server-generated draft UUID." }),
  })
  .openapi("DraftParams");

export const CreateDraftBodySchema = z
  .object({
    daoId: z.string().min(1),
    title: z.string().default(""),
    discussionUrl: z.string().default(""),
    body: z.string().default(""),
    actions: z.array(ActionSchema).default([]),
  })
  .openapi("CreateDraftBody");

export const UpdateDraftBodySchema = z
  .object({
    title: z.string().optional(),
    discussionUrl: z.string().optional(),
    body: z.string().optional(),
    actions: z.array(ActionSchema).optional(),
  })
  .openapi("UpdateDraftBody");
