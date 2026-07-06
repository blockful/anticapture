# @anticapture/auth

Reusable Sign-In With Ethereum (SIWE / EIP-4361) authentication for Blockful Hono backends.
Framework-free crypto/verification core; a deliberate `hono/jwt` session layer; a
`@hono/zod-openapi` route bundle and middleware for Hono apps.

## Install

```bash
pnpm add @anticapture/auth
```

`viem`, `hono`, and `@hono/zod-openapi` are **peerDependencies** — install them in your app if
they aren't already there. They are not bundled as `dependencies` so that your app and this
package share a single `viem`/`zod` module identity (avoids `instanceof`/brand mismatches from
duplicate copies in the dependency graph).

## Exports

- `AddressSchema`, `SiweVerifyBodySchema`, `NonceResponseSchema` — Zod (via
  `@hono/zod-openapi`) schemas.
- `generateNonce`, `NonceStore` (interface) — nonce primitives.
- `memoryNonceStore` — bundled in-memory `NonceStore` reference implementation.
- `verifySiweSignature`, `verifySiwe`, `SiweVerificationError`, `VerifiedSiwe`, `SiweFields` —
  verification core.
- `issueSession`, `verifySession`, `Session` — HS256 JWT session helpers.
- `siweAuth` — Hono middleware guarding routes with a session token.
- `mountAuthRoutes` — registers `GET /auth/nonce` and `POST /auth/verify` on an `OpenAPIHono` app.

## Plugging a `NonceStore`

```ts
import type { NonceStore } from "@anticapture/auth";
```

`NonceStore` has two methods:

```ts
interface NonceStore {
  issue(nonce: string, ttlMs?: number): Promise<void>;
  consume(nonce: string): Promise<boolean>;
}
```

**Atomicity contract:** `consume` MUST be an atomic test-and-delete. It must return `true` to
exactly one caller for a given nonce — even under concurrent calls — and `false` to every other
caller (unknown, already-consumed, or expired nonce). A naive `get` followed by a separate
`delete` is **not** atomic and opens a time-of-check-to-time-of-use race that lets a SIWE message
be replayed by two concurrent requests. The bundled `memoryNonceStore` satisfies this contract
in-process (no `await` between its internal read and delete); its
`src/stores/memory.test.ts` concurrent-consume test is the reference test any custom store should
pass. `memoryNonceStore` is dev/single-instance only — for multi-instance production deployments,
implement a durable store (Redis/Postgres) that preserves this same atomicity guarantee.

`memoryNonceStore` is bounded by `maxEntries` (default 10 000). When full — after reclaiming
expired entries — `issue` **throws** rather than evicting a live, unconsumed nonce (evicting would
let a flood of `/auth/nonce` requests knock out honest users' pending logins). Rate-limit the
nonce endpoint regardless (see Security notes).

## Middleware and routes

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { memoryNonceStore, mountAuthRoutes, siweAuth } from "@anticapture/auth";

const app = new OpenAPIHono();
const store = memoryNonceStore();

mountAuthRoutes(app, {
  store,
  secret: process.env.SESSION_SECRET!,
  domain: "app.example.com",
  chainId: 1,
  sessionTtlSec: 3600,
});

app.get("/me", siweAuth({ secret: process.env.SESSION_SECRET! }), (c) => {
  const { address } = c.get("siweUser");
  return c.json({ address });
});
```

`siweAuth` returns distinguishable 401 reasons: `missing_token`, `invalid_token`,
`expired_token`.

## Verify strictness

`verifySiwe` is the store-aware, strict entry point and rejects on:

- invalid/tampered signature,
- unknown or already-consumed nonce,
- wrong `domain` (phishing resistance),
- wrong `chainId` (cross-chain replay resistance),
- expired (`expirationTime`) or not-yet-valid (`notBefore`) messages.

It only consumes the nonce **after** all of the above pass — a bad signature or stale message
never burns a valid nonce. `verifySiweSignature` is the lower-level, framework-free primitive
that checks _authenticity only_ (no domain/chainId/expiry/nonce assertions); use it directly if
you need signature verification without the store-aware bookkeeping (e.g. a one-shot mint flow).

## EOA vs EIP-1271 (smart-contract wallets)

By default, `verifySiweSignature`/`verifySiwe` assume an EOA signer and recover the address
directly from the signature (no RPC call required). To support smart-contract wallets (e.g. Safe
multisigs used by governance delegates), inject a viem `Client` **on the message's chain**:

```ts
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({ chain: mainnet, transport: http() });

await verifySiwe({
  message,
  signature,
  store,
  expectedDomain,
  expectedChainId,
  client,
});
```

With a `client`, verification goes through viem's `verifySiweMessage` (EIP-1271/ERC-6492
capable) instead of raw ECDSA recovery. Without a `client`, only EOA signatures are accepted.

## `AddressSchema`

`AddressSchema` in `src/schemas.ts` is the standard viem address idiom (`isAddress` +
`getAddress`) — a small, stable primitive owned by this package. `apps/api/src/mappers/shared.ts`
defines an equivalent schema for its own use; the two are **independent** (a package cannot import
from an app, and there is no app-specific logic here, so no manual sync is needed). When the API
adopts this package it can re-export this one as the single source of truth.

## Security notes

- **Secret strength:** `secret` (for `issueSession`/`verifySession`/`siweAuth`/`mountAuthRoutes`)
  must be at least 32 high-entropy characters — shorter secrets are rejected at the boundary.
- **Rate-limit `GET /auth/nonce`:** it is unauthenticated and writes to the store on every call.
  Put a rate limiter in front of it (and prefer a durable, TTL-backed store in production).
- **`POST /auth/verify` error semantics:** genuine verification failures return `401`
  (`verification_failed`); unexpected errors (nonce-store outage, EIP-1271 RPC failure) propagate
  to your app's error handler as a `5xx` so outages are observable instead of looking like user
  auth failures.
- **EIP-1271 client chain:** an injected `client` MUST target the same chain as `chainId`, or the
  on-chain signature check runs against the wrong contract state.

## Gateful `Authorization`-strip gotcha

Gateful strips the `Authorization` header when proxying requests to DAO APIs. Because of this,
`siweAuth`/`mountAuthRoutes` do **not** use `Authorization: Bearer <token>` — they default to a
custom `x-user-token` header instead. Any future adopter proxying auth-guarded requests through
gateful must carry the session token in `x-user-token` (or another custom header), not
`Authorization`.
