import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { getAddress } from "viem";

import { EnrichmentService } from "@/services/enrichment";

import {
  AddressRequestSchema,
  AddressResponseSchema,
  AddressesRequestSchema,
  AddressesResponseSchema,
} from "./mappers";

export function addressController(app: Hono, service: EnrichmentService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getAddress",
      path: "/address/{address}",
      summary: "Get enriched data for an address",
      description:
        "Returns label information from Arkham, ENS data, and whether the address is an EOA or contract. Arkham data is stored permanently. ENS data is cached with a configurable TTL.",
      tags: ["address"],
      request: {
        params: AddressRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved address enrichment data",
          content: {
            "application/json": {
              schema: AddressResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { address } = context.req.valid("param");
      const result = await service.getAddressEnrichment(address);
      const response = AddressResponseSchema.safeParse(result);
      return context.json(response.data);
    },
  );

  // Batch endpoint
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getAddresses",
      path: "/addresses",
      summary: "Get enriched data for multiple addresses",
      description:
        "Returns label information from Arkham, ENS data, and address type for multiple addresses. Maximum 100 addresses per request. Arkham data is stored permanently. ENS data is cached with a configurable TTL.",
      tags: ["address"],
      request: {
        query: AddressesRequestSchema,
      },
      responses: {
        200: {
          description: "Successfully retrieved batch enrichment data",
          content: {
            "application/json": {
              schema: AddressesResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { addresses } = context.req.valid("query");

      // Deduplicate addresses
      const uniqueAddresses = [...new Set(addresses.map((a) => getAddress(a)))];

      const results: z.infer<typeof AddressResponseSchema>[] = [];
      const errors: { address: string; error: string }[] = [];

      // Process in parallel with concurrency limit
      const CONCURRENCY = 10;
      for (let i = 0; i < uniqueAddresses.length; i += CONCURRENCY) {
        const batch = uniqueAddresses.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map((address) => service.getAddressEnrichment(address)),
        );

        batchResults.forEach((result) => {
          if (result.status === "fulfilled") {
            const response = AddressResponseSchema.safeParse(result.value);
            if (response.success) {
              results.push(response.data);
            }
          }
        });
      }

      return context.json({ results, errors });
    },
  );
}
