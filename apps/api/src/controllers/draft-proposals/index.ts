import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import {
  CreateDraftBodySchema,
  DeleteDraftQuerySchema,
  DraftListResponseSchema,
  DraftParamsSchema,
  DraftResponseSchema,
  ListDraftsQuerySchema,
  UpdateDraftBodySchema,
} from "@/mappers/draft-proposals";
import { ErrorResponseSchema } from "@/mappers/shared";
import type { DraftProposalsService } from "@/services/draft-proposals";

export function draftProposals(
  app: Hono,
  service: DraftProposalsService,
  daoId: string,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getDraftProposals",
      path: "/proposal-drafts",
      summary: "List draft proposals for an address",
      tags: ["draft-proposals"],
      request: { query: ListDraftsQuerySchema },
      responses: {
        200: {
          description: "Draft proposals owned by the given address",
          content: { "application/json": { schema: DraftListResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { address } = c.req.valid("query");
      const drafts = await service.getDrafts(address, daoId);
      return c.json(DraftListResponseSchema.parse({ items: drafts }), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      operationId: "getDraftProposal",
      path: "/proposal-drafts/{id}",
      summary: "Get a draft proposal by ID",
      description:
        "Public endpoint — anyone with the ID can view the draft, enabling sharing.",
      tags: ["draft-proposals"],
      request: { params: DraftParamsSchema },
      responses: {
        200: {
          description: "The requested draft proposal",
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
      const draft = await service.getDraftById(id, daoId);
      if (!draft) return c.json({ error: "Draft not found" }, 404);
      return c.json(DraftResponseSchema.parse(draft), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      operationId: "createDraftProposal",
      path: "/proposal-drafts",
      summary: "Create a draft proposal",
      tags: ["draft-proposals"],
      request: {
        body: {
          content: { "application/json": { schema: CreateDraftBodySchema } },
        },
      },
      responses: {
        201: {
          description: "The created draft proposal",
          content: { "application/json": { schema: DraftResponseSchema } },
        },
      },
    }),
    async (c) => {
      const body = c.req.valid("json");
      const draft = await service.createDraft({
        id: body.id,
        daoId,
        author: body.address,
        title: body.title,
        discussionUrl: body.discussionUrl,
        body: body.body,
        actions: body.actions,
      });
      return c.json(DraftResponseSchema.parse(draft), 201);
    },
  );

  app.openapi(
    createRoute({
      method: "put",
      operationId: "updateDraftProposal",
      path: "/proposal-drafts/{id}",
      summary: "Update a draft proposal",
      description:
        "Only the original author (matched by address) can update a draft.",
      tags: ["draft-proposals"],
      request: {
        params: DraftParamsSchema,
        body: {
          content: { "application/json": { schema: UpdateDraftBodySchema } },
        },
      },
      responses: {
        200: {
          description: "The updated draft proposal",
          content: { "application/json": { schema: DraftResponseSchema } },
        },
        404: {
          description: "Draft not found or address does not match author",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { address, ...patch } = c.req.valid("json");
      const draft = await service.updateDraft(id, address, daoId, patch);
      if (!draft) return c.json({ error: "Draft not found" }, 404);
      return c.json(DraftResponseSchema.parse(draft), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      operationId: "deleteDraftProposal",
      path: "/proposal-drafts/{id}",
      summary: "Delete a draft proposal",
      description:
        "Only the original author (matched by address) can delete a draft.",
      tags: ["draft-proposals"],
      request: {
        params: DraftParamsSchema,
        query: DeleteDraftQuerySchema,
      },
      responses: {
        204: { description: "Draft deleted" },
        404: {
          description: "Draft not found or address does not match author",
          content: { "application/json": { schema: ErrorResponseSchema } },
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { address } = c.req.valid("query");
      const deleted = await service.deleteDraft(id, address, daoId);
      if (!deleted) return c.json({ error: "Draft not found" }, 404);
      return c.body(null, 204);
    },
  );
}
