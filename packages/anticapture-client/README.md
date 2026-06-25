# @anticapture/client

TypeScript SDK for the Anticapture Gateful API.

## Installation

```sh
npm install @anticapture/client
```

React Query hooks are available from the `@anticapture/client/hooks` subpath:

```ts
import { accountBalances } from "@anticapture/client";
import { useAccountBalances } from "@anticapture/client/hooks";
```

## Usage

### Vanilla fetch (no framework)

```ts
import { accountBalances } from "@anticapture/client";

const response = await accountBalances("uniswap", { limit: 10 });
const topHolders = response.data;
```

### React Query hook

```tsx
import { useAccountBalances } from "@anticapture/client/hooks";

function TopHolders() {
  const { data, isPending, isError } = useAccountBalances("uniswap", {
    limit: 10,
  });

  if (isPending) return <p>Loading…</p>;
  if (isError) return <p>Failed to load holders.</p>;

  return (
    <ul>
      {data?.items.map((account) => (
        <li key={account.address}>
          {account.address} — {account.balance}
        </li>
      ))}
    </ul>
  );
}
```

### Default headers

Use `setClientConfig` to inject headers on every request — useful for
attaching an API key or a `x-client-source` identifier at app startup.

```ts
import { setClientConfig } from "@anticapture/client";

setClientConfig({
  defaultHeaders: {
    "x-client-source": "my-app",
    "x-api-key": "your-api-key",
  },
});
```

Call `setClientConfig` once before any API calls are made (e.g. in your app's
entry point or a provider component). Headers are merged into every subsequent
request; calling `setClientConfig` again adds or overrides individual keys
without clearing the ones already set.

### Custom base URL

The client defaults to `/api/gateful` (relative, works with a Next.js proxy).
Pass `baseURL` per-call to target a different host:

```ts
import { accountBalances } from "@anticapture/client";

const response = await accountBalances(
  "uniswap",
  { limit: 10 },
  { baseURL: "https://api.anticapture.xyz" },
);
```

### Testing with MSW

Mock Service Worker handlers seeded with faker data are available from the
`@anticapture/client/msw` subpath. Use them to mock the Gateful API in tests
without hitting the network.

```sh
npm install --save-dev msw
```

The simplest path is `createTestServer`, which wraps `setupServer` from
`msw/node` with all generated handlers pre-registered:

```ts
import { createTestServer } from "@anticapture/client/msw";

const server = createTestServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("intercepts a generated route", async () => {
  const res = await fetch("http://localhost/health");
  const body = await res.json();
  expect(body).toBeTruthy();
});
```

Handlers match any host (the generator emits `*/path` patterns), so calls to
`http://localhost`, `https://api.anticapture.xyz`, or any other base URL are
intercepted without extra configuration.

To append a custom handler, import `http` and `HttpResponse` **from this
subpath** (not from `msw` directly) and pass them to `createTestServer`:

```ts
import { createTestServer, http, HttpResponse } from "@anticapture/client/msw";

const custom = http.get("*/custom", () => HttpResponse.json({ ok: true }));
const server = createTestServer(custom);
```

> **Why import `http`/`HttpResponse` from this subpath?** MSW v2.8+ ships dual
> `.d.ts` files that TypeScript treats as nominally distinct via a private
> `__kind` brand on `RequestHandler` (see
> [mswjs/msw#498](https://github.com/mswjs/msw/discussions/498)). Routing
> consumer-built handlers through this re-export funnels them into the same
> module identity our types resolve to, which avoids `as any` casts at the
> `setupServer` boundary.

Required `tsconfig` setting: `"moduleResolution": "bundler"` or `"nodenext"`
so the `@anticapture/client/msw` subpath in `package.json#exports` resolves.
Classic `"node"` resolution does not honor `exports` maps.

## MCP server

The package ships an MCP server that exposes the Gateful API as tools for
agentic clients. Two transports are available:

- `pnpm mcp` (`mcp-server.ts`) — stdio, for clients that spawn the server as a
  child process (Claude Desktop, local agents).
- `pnpm mcp-http` (`mcp-server-http.ts`) — Streamable HTTP with session
  management, used by the deployed `infra/mcp-server` image. Token validation
  is delegated to Gateful: the inbound bearer is forwarded upstream and guarded
  by Gateful's `tokenAuthMiddleware` (Redis cache + fail-open fallback).

Environment:

- `ANTICAPTURE_API_URL` — upstream Gateful base URL (default
  `http://localhost:4001`).
- `ANTICAPTURE_API_KEY` — bearer token sent to the upstream Gateful API. Omit
  when forwarding the caller's own token (`FORWARD_CLIENT_AUTH=true`).
- `FORWARD_CLIENT_AUTH` — when `true`, the caller's inbound `Authorization`
  header is forwarded to Gateful, which validates the per-tenant token via its
  `tokenAuthMiddleware`. This server does not validate tokens itself.
- `PORT` / `HOST` — HTTP server bind (default `3100` / `0.0.0.0`).

### Wiring into Claude Desktop (stdio)

`mcp-server.sh` is a thin launcher that `cd`s into the package directory and
runs `mcp-server.ts` with the bundled `tsx`. Claude Desktop spawns the script
from an arbitrary cwd, so the `cd` is what makes the relative `tsx` lookup
work. Point Claude Desktop at the script with the absolute path to your
checkout:

```json
{
  "mcpServers": {
    "anticapture": {
      "type": "stdio",
      "command": "sh",
      "args": [
        "/absolute/path/to/anticapture/packages/anticapture-client/mcp-server.sh"
      ]
    }
  }
}
```

Run `pnpm install` and `pnpm codegen` in the package once before launching so
that `node_modules/.bin/tsx` and `generated/` are present.

## Development

The SDK and client docs resolve the Gateful OpenAPI source through the shared
spec resolver. Codegen always uses the injected live Gateful URL: `${ANTICAPTURE_API_URL}/docs/json`

Preview and production environments must inject `ANTICAPTURE_API_URL`
directly. CI sets a branch-scoped Vercel preview variable from the PR number;

Codegen runs `scripts/wait-for-gateful.mjs` before Kubb. In CI and Vercel,
`EXPECTED_GATEFUL_SHA` / `VERCEL_GIT_COMMIT_SHA` makes readiness require
`GET /health` to return the matching deployed Gateful commit. Local runs without
an expected SHA only require `/health` to return `200`.

```sh
npm run codegen
npm run test
npm run typecheck
npm run lint
npm run build
```

`npm run build` regenerates the SDK and bundles the public entry points into `dist/` with tsup.

## Publishing

The package publishes compiled JavaScript and declaration files only. `generated/` and `dist/` are not committed.

Prerequisites:

- The `@anticapture` npm organization exists.
- The publisher is authenticated with npm and has publish access for `@anticapture/client`.
- Local publishes use an npm account with two-factor authentication enabled. If npm does not prompt for a one-time password, pass it explicitly with `--otp`.
- Token-based publishes use a granular npm access token with publish access and bypass 2FA enabled.
- For GitHub Actions publishing, the repository has an `NPM_TOKEN` secret configured with that granular token.

Manual publish:

```sh
npm login
npm run build
npm publish --access public --otp=123456
```

Replace `123456` with the current one-time password from the publisher's npm authenticator app. Do not pass `--provenance` when publishing from a local shell. npm can only generate provenance from a supported cloud CI provider with OIDC, so local publishes should omit that flag. For a provenance-backed publish, use the GitHub Actions workflow below.

`prepack` runs `npm run build` before `npm pack` and `npm publish`, so the tarball is generated from a fresh OpenAPI SDK build.

Automated publish:

Create a tag that starts with `client-v`, for example:

```sh
git tag client-v1.0.0
git push origin client-v1.0.0
```

The publish workflow can also be run manually from GitHub Actions.
