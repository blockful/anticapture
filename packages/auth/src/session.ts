import { sign, verify } from "hono/jwt";
import type { Address } from "viem";

const JWT_ALG = "HS256";

/** Minimum HMAC secret length (chars) — HS256 is only as strong as its key. */
const MIN_SECRET_LENGTH = 32;

const assertSecret = (secret: string): void => {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `auth secret must be a string of at least ${MIN_SECRET_LENGTH} high-entropy characters`,
    );
  }
};

export interface Session {
  address: Address;
  claims: Record<string, unknown>;
}

export interface IssueSessionParams {
  address: Address;
  secret: string;
  expiresInSec: number;
  claims?: Record<string, unknown>;
}

/**
 * Issues an HS256 session JWT. Claims shape is pinned: `{ ...claims, sub:
 * <checksummed address>, iat, exp }` — `sub` always carries the address.
 */
export const issueSession = async (
  params: IssueSessionParams,
): Promise<string> => {
  const { address, secret, expiresInSec, claims } = params;
  assertSecret(secret);
  const iat = Math.floor(Date.now() / 1000);

  const payload = {
    ...claims,
    sub: address,
    iat,
    exp: iat + expiresInSec,
  };

  return sign(payload, secret, JWT_ALG);
};

/**
 * Verifies an HS256 session JWT and returns the address (`sub`) plus any
 * additional claims. Throws if the token is missing, tampered, expired, or
 * signed with a different algorithm.
 */
export const verifySession = async (
  token: string,
  secret: string,
): Promise<Session> => {
  assertSecret(secret);
  const payload = await verify(token, secret, JWT_ALG);
  const { sub, iat: _iat, exp: _exp, ...claims } = payload;

  if (typeof sub !== "string") {
    throw new Error("session token is missing a string `sub` (address) claim");
  }

  return {
    address: sub as Address,
    claims,
  };
};
