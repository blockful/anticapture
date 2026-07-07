import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import type { Client, Hex } from "viem";

import type { NonceStore } from "../nonce.js";
import { generateNonce } from "../nonce.js";
import {
  AddressSchema,
  NonceResponseSchema,
  SiweVerifyBodySchema,
} from "../schemas.js";
import { assertSecret, issueSession } from "../session.js";
import { SiweVerificationError, verifySiwe } from "../verify.js";

const SessionResponseSchema = z.object({
  token: z.string(),
  address: AddressSchema,
});

const ErrorResponseSchema = z.object({
  error: z.string(),
});

export interface MountAuthRoutesOptions {
  store: NonceStore;
  secret: string;
  /**
   * Domain(s) SIWE messages may be bound to. Pass an array when the same API
   * serves multiple frontend hosts (e.g. whitelabel deployments).
   */
  domain: string | string[];
  chainId: number;
  /**
   * Optional viem client enabling EIP-1271 smart-contract-wallet verification.
   * It MUST be configured for the same chain as `chainId`, otherwise 1271
   * signature validation runs against the wrong chain's contract state.
   */
  client?: Client;
  sessionTtlSec?: number;
  nonceTtlMs?: number;
}

const nonceRoute = createRoute({
  method: "get",
  path: "/auth/nonce",
  responses: {
    200: {
      description: "A freshly issued SIWE nonce",
      content: {
        "application/json": {
          schema: NonceResponseSchema,
        },
      },
    },
  },
});

const verifyRoute = createRoute({
  method: "post",
  path: "/auth/verify",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: SiweVerifyBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "A session token for the verified SIWE message",
      content: {
        "application/json": {
          schema: SessionResponseSchema,
        },
      },
    },
    401: {
      description: "SIWE verification failed",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * Mounts `GET /auth/nonce` and `POST /auth/verify` onto an `OpenAPIHono` app.
 */
export const mountAuthRoutes = (
  app: OpenAPIHono,
  options: MountAuthRoutesOptions,
): void => {
  const {
    store,
    secret,
    domain,
    chainId,
    client,
    sessionTtlSec = 3600,
    nonceTtlMs,
  } = options;
  // Fail fast on a misconfigured secret instead of erroring on the first
  // `issueSession` call after a successful SIWE verification.
  assertSecret(secret);
  // Same rationale for an empty domain allowlist: it would reject every
  // sign-in as a 401 while the real problem is deployment configuration.
  if (Array.isArray(domain) && domain.length === 0) {
    throw new Error("mountAuthRoutes: domain must not be empty");
  }

  app.openapi(nonceRoute, async (c) => {
    const nonce = generateNonce();
    await store.issue(nonce, nonceTtlMs);
    return c.json({ nonce }, 200);
  });

  app.openapi(verifyRoute, async (c) => {
    const { message, signature } = c.req.valid("json");

    try {
      const { address } = await verifySiwe({
        message,
        signature: signature as Hex,
        store,
        expectedDomain: domain,
        expectedChainId: chainId,
        client,
      });

      const token = await issueSession({
        address,
        secret,
        expiresInSec: sessionTtlSec,
      });

      return c.json({ token, address }, 200);
    } catch (error) {
      // Only genuine verification failures are 401. Unexpected errors (nonce
      // store outage, EIP-1271 RPC failure, etc.) propagate to the app's error
      // handler as a 5xx so outages are observable instead of masquerading as
      // user auth failures.
      if (error instanceof SiweVerificationError) {
        return c.json({ error: "verification_failed" }, 401);
      }
      throw error;
    }
  });
};
