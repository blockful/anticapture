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

// Self-service accounts can create drafts, so every persisted field is
// bounded — the row-count quota alone wouldn't stop one user from storing
// megabytes per row. Generous for real proposals, hostile to abuse. The app
// additionally enforces an overall request body limit.
const TITLE_MAX = 300;
const URL_MAX = 2048;
const BODY_MAX = 100_000;
const ACTIONS_MAX = 50;

export const CreateDraftBodySchema = z
  .object({
    daoId: z.string().min(1).max(64),
    title: z.string().max(TITLE_MAX).default(""),
    discussionUrl: z.string().max(URL_MAX).default(""),
    body: z.string().max(BODY_MAX).default(""),
    actions: z.array(ActionSchema).max(ACTIONS_MAX).default([]),
  })
  .openapi("CreateDraftBody");

export const UpdateDraftBodySchema = z
  .object({
    title: z.string().max(TITLE_MAX).optional(),
    discussionUrl: z.string().max(URL_MAX).optional(),
    body: z.string().max(BODY_MAX).optional(),
    actions: z.array(ActionSchema).max(ACTIONS_MAX).optional(),
  })
  .openapi("UpdateDraftBody");
