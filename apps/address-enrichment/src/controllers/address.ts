import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { isAddress } from "viem";

import { EnrichmentService } from "@/services/enrichment";

const AddressParamSchema = z.object({
  address: z.string().refine((addr) => isAddress(addr), {
    message: "Invalid Ethereum address",
  }),
});

const EnrichmentResponseSchema = z.object({
  address: z.string(),
  isContract: z.boolean(),
  arkham: z
    .object({
      entity: z.string().nullable(),
      entityType: z.string().nullable(),
      label: z.string().nullable(),
    })
    .nullable(),
  createdAt: z.string(),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export function addressController(app: Hono, service: EnrichmentService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getAddressEnrichment",
      path: "/address/{address}",
      summary: "Get enriched data for an address",
      description:
        "Returns label information from Arkham and whether the address is an EOA or contract. Data is permanently stored after first fetch.",
      tags: ["address"],
      request: {
        params: AddressParamSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved address enrichment data",
          content: {
            "application/json": {
              schema: EnrichmentResponseSchema,
            },
          },
        },
        400: {
          description: "Invalid address format",
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { address } = context.req.valid("param");

      try {
        const result = await service.getAddressEnrichment(address);
        return context.json(result, 200);
      } catch (error) {
        console.error("Error enriching address:", error);
        return context.json(
          {
            error: "Internal server error",
            message:
              error instanceof Error ? error.message : "Unknown error occurred",
          },
          500,
        );
      }
    },
  );
}
