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

const BatchRequestSchema = z.object({
  addresses: z
    .array(
      z.string().refine((addr) => isAddress(addr), {
        message: "Invalid Ethereum address",
      }),
    )
    .min(1, "At least one address is required")
    .max(100, "Maximum 100 addresses per request"),
});

const BatchResponseSchema = z.object({
  results: z.array(EnrichmentResponseSchema),
  errors: z.array(
    z.object({
      address: z.string(),
      error: z.string(),
    }),
  ),
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

  // Batch endpoint
  app.openapi(
    createRoute({
      method: "post",
      operationId: "batchAddressEnrichment",
      path: "/addresses",
      summary: "Get enriched data for multiple addresses",
      description:
        "Returns label information from Arkham and address type for multiple addresses. Maximum 100 addresses per request. Data is permanently stored after first fetch.",
      tags: ["address"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: BatchRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Successfully retrieved batch enrichment data",
          content: {
            "application/json": {
              schema: BatchResponseSchema,
            },
          },
        },
        400: {
          description: "Invalid request body",
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
      const { addresses } = context.req.valid("json");

      // Deduplicate addresses
      const uniqueAddresses = [
        ...new Set(addresses.map((a) => a.toLowerCase())),
      ];

      const results: z.infer<typeof EnrichmentResponseSchema>[] = [];
      const errors: { address: string; error: string }[] = [];

      // Process in parallel with concurrency limit
      const CONCURRENCY = 10;
      for (let i = 0; i < uniqueAddresses.length; i += CONCURRENCY) {
        const batch = uniqueAddresses.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map((address) => service.getAddressEnrichment(address)),
        );

        batchResults.forEach((result, index) => {
          const address = batch[index]!;
          if (result.status === "fulfilled") {
            results.push(result.value);
          } else {
            errors.push({
              address,
              error:
                result.reason instanceof Error
                  ? result.reason.message
                  : "Unknown error",
            });
          }
        });
      }

      return context.json({ results, errors }, 200);
    },
  );
}
