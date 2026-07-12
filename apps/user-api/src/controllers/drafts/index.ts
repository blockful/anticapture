import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";

import type { AuthResolver } from "@/auth";
import {
  CreateDraftBodySchema,
  DraftListResponseSchema,
  DraftParamsSchema,
  DraftResponseSchema,
  ErrorResponseSchema,
  ListDraftsQuerySchema,
  UpdateDraftBodySchema,
} from "@/mappers/drafts";
import { optionalSession, sessionAuth } from "@/middlewares/session";
import type { DraftRow } from "@/repositories/drafts";
import { DraftQuotaExceededError, type DraftsService } from "@/services/drafts";

const toResponse = (row: DraftRow, sessionUserId: string | null) => ({
  id: row.id,
  daoId: row.daoId,
  authorAddress: row.authorAddress,
  title: row.title,
  discussionUrl: row.discussionUrl,
  body: row.body,
  actions: row.actions as Record<string, unknown>[],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  // Never derived client-side: a Google author has no wallet to compare, and
  // the caller's identity comes exclusively from the session.
  isOwner: row.userId !== null && row.userId === sessionUserId,
});

const unauthorizedResponses = {
  400: {
    description: "Request Host is not a trusted domain",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  401: {
    description: "Missing or invalid session",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
} as const;

export function draftsController(
  app: OpenAPIHono,
  service: DraftsService,
  resolver: AuthResolver,
) {
  const auth = sessionAuth(resolver);
  const maybeAuth = optionalSession(resolver);

  app.openapi(
    createRoute({
      method: "get",
      operationId: "listDrafts",
      path: "/drafts",
      summary: "List the session user's drafts for a DAO",
      middleware: [auth] as const,
      request: { query: ListDraftsQuerySchema },
      responses: {
        200: {
          description: "Drafts owned by the session user, newest first",
          content: { "application/json": { schema: DraftListResponseSchema } },
        },
        ...unauthorizedResponses,
      },
    }),
    async (c) => {
      const { daoId } = c.req.valid("query");
      const { id: userId } = c.get("sessionUser");
      const rows = await service.listForUser(userId, daoId);
      return c.json(
        DraftListResponseSchema.parse({
          items: rows.map((r) => toResponse(r, userId)),
        }),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getDraft",
      path: "/drafts/{id}",
      summary: "Get a draft by ID",
      description:
        "Public share endpoint — anyone with the ID can view the draft. " +
        "isOwner reflects the caller's session, when one is present.",
      middleware: [maybeAuth] as const,
      request: { params: DraftParamsSchema },
      responses: {
        200: {
          description: "The requested draft",
          content: { "application/json": { schema: DraftResponseSchema } },
        },
        404: {
          description: "Draft not found",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const sessionUser = c.get("sessionUser");
      const draft = await service.getById(id, sessionUser?.id ?? null);
      if (!draft) return c.json({ error: "draft_not_found" }, 404);
      return c.json(
        DraftResponseSchema.parse(toResponse(draft, sessionUser?.id ?? null)),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      operationId: "createDraft",
      path: "/drafts",
      summary: "Create a draft",
      description:
        "The draft id is generated server-side (it doubles as the share " +
        "capability) and the author is the session user.",
      middleware: [auth] as const,
      request: {
        body: {
          // Without this a body-less POST skips JSON validation entirely and
          // surfaces as a DB 500 instead of the intended 400.
          required: true,
          content: { "application/json": { schema: CreateDraftBodySchema } },
        },
      },
      responses: {
        201: {
          description: "The created draft",
          content: { "application/json": { schema: DraftResponseSchema } },
        },
        403: {
          description: "Draft quota reached",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
        ...unauthorizedResponses,
      },
    }),
    async (c) => {
      const body = c.req.valid("json");
      const { id: userId } = c.get("sessionUser");
      try {
        const draft = await service.create({ ...body, userId });
        return c.json(
          DraftResponseSchema.parse(toResponse(draft, userId)),
          201,
        );
      } catch (err) {
        if (err instanceof DraftQuotaExceededError) {
          return c.json({ error: "draft_limit_reached" }, 403);
        }
        throw err;
      }
    },
  );

  app.openapi(
    createRoute({
      method: "put",
      operationId: "updateDraft",
      path: "/drafts/{id}",
      summary: "Update a draft",
      description:
        "Only the owner can update. Ownership comes from the session.",
      middleware: [auth] as const,
      request: {
        params: DraftParamsSchema,
        body: {
          required: true,
          content: { "application/json": { schema: UpdateDraftBodySchema } },
        },
      },
      responses: {
        200: {
          description: "The updated draft",
          content: { "application/json": { schema: DraftResponseSchema } },
        },
        404: {
          // Identical for nonexistent and foreign rows — no existence oracle.
          description: "Draft not found",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
        ...unauthorizedResponses,
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const patch = c.req.valid("json");
      const { id: userId } = c.get("sessionUser");
      const draft = await service.update(id, userId, patch);
      if (!draft) return c.json({ error: "draft_not_found" }, 404);
      return c.json(DraftResponseSchema.parse(toResponse(draft, userId)), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      operationId: "deleteDraft",
      path: "/drafts/{id}",
      summary: "Delete a draft",
      description:
        "Only the owner can delete. Ownership comes from the session.",
      middleware: [auth] as const,
      request: { params: DraftParamsSchema },
      responses: {
        204: { description: "Draft deleted" },
        404: {
          // Identical for nonexistent and foreign rows — no existence oracle.
          description: "Draft not found",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
        ...unauthorizedResponses,
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { id: userId } = c.get("sessionUser");
      const deleted = await service.delete(id, userId);
      if (!deleted) return c.json({ error: "draft_not_found" }, 404);
      return c.body(null, 204);
    },
  );
}
