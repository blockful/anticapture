import { OpenAPIHono as Hono, createRoute, z } from "@hono/zod-openapi";
import { isAddress } from "viem";

import type { EfpClient } from "@/clients/efp";
import { logger } from "@/logger";
import { getFollowingInSet } from "@/services/efp-following-in-set";

const AddressSchema = z
  .string()
  .refine((addr) => isAddress(addr, { strict: false }))
  .transform((addr) => addr.toLowerCase());

const ErrorResponseSchema = z.object({
  error: z.string(),
});

const EfpFollowerStateResponseSchema = z.object({
  addressUser: z.string().openapi({
    description: "Address being followed (target account)",
    example: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  }),
  addressFollower: z.string().openapi({
    description: "Potential follower address (viewer account)",
    example: "0x983110309620d911731ac0932219af06091b6744",
  }),
  state: z
    .object({
      follow: z.boolean().openapi({
        description: "Whether the follower follows the user on EFP",
        example: true,
      }),
      block: z.boolean().openapi({
        description: "Whether the follower has blocked the user on EFP",
        example: false,
      }),
      mute: z.boolean().openapi({
        description: "Whether the follower has muted the user on EFP",
        example: false,
      }),
    })
    .openapi({
      description: "EFP relationship state between follower and user",
    }),
});

const FollowingInSetRequestSchema = z.object({
  viewer: AddressSchema.openapi({
    description: "Connected wallet address of the viewer",
    example: "0x983110309620d911731ac0932219af06091b6744",
  }),
  addresses: z
    .array(AddressSchema)
    .min(1, "At least one address is required")
    .max(100, "Maximum 100 addresses per request")
    .openapi({
      description:
        "Candidate addresses to check whether the viewer follows them on EFP",
      example: [
        "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5",
      ],
    }),
});

const FollowingInSetResponseSchema = z.object({
  followed: z.array(z.string()).openapi({
    description:
      "Lowercase addresses from the input set that the viewer follows on EFP",
    example: ["0xd8da6bf26964af9d7eed9e03e53415d37aa96045"],
  }),
});

export function efpController(app: Hono, efpClient: EfpClient) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getEfpFollowerState",
      path: "/efp/users/{user}/{follower}/follower-state",
      summary: "Get EFP follower state between two addresses",
      description:
        'Returns whether the follower address follows the user address on Ethereum Follow Protocol. Used for viewer-specific UI such as "You follow" labels.',
      tags: ["efp"],
      request: {
        params: z.object({
          user: AddressSchema.openapi({
            param: { name: "user", in: "path" },
            description: "Target account (address being followed)",
          }),
          follower: AddressSchema.openapi({
            param: { name: "follower", in: "path" },
            description: "Potential follower account (viewer)",
          }),
        }),
      },
      responses: {
        200: {
          description: "Successfully retrieved EFP follower state",
          content: {
            "application/json": {
              schema: EfpFollowerStateResponseSchema,
            },
          },
        },
        404: {
          description: "Follower state not found",
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
        502: {
          description: "Upstream EFP API failed",
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { user, follower } = context.req.valid("param");
      try {
        const state = await efpClient.getFollowerState(user, follower);
        if (!state) {
          return context.json({ error: "Follower state not found" }, 404);
        }
        return context.json(EfpFollowerStateResponseSchema.parse(state), 200);
      } catch (err) {
        logger.error({ err, user, follower }, "EFP follower state failed");
        return context.json({ error: "Failed to fetch follower state" }, 502);
      }
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      operationId: "postEfpFollowingInSet",
      path: "/efp/following-in-set",
      summary: "Find which addresses in a set the viewer follows on EFP",
      description:
        "Batch-checks up to 100 addresses against the viewer's EFP follow graph. Returns the subset the viewer follows (excluding block/mute relationships).",
      tags: ["efp"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: FollowingInSetRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Successfully filtered followed addresses",
          content: {
            "application/json": {
              schema: FollowingInSetResponseSchema,
            },
          },
        },
        502: {
          description: "Upstream EFP API failed",
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
        },
      },
    }),
    async (context) => {
      const { viewer, addresses } = context.req.valid("json");
      try {
        const followed = await getFollowingInSet(efpClient, viewer, addresses);
        return context.json({ followed }, 200);
      } catch (err) {
        logger.error({ err, viewer }, "EFP following-in-set failed");
        return context.json({ error: "Failed to check following in set" }, 502);
      }
    },
  );
}
