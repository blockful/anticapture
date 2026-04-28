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

## Development

The SDK is generated from `apps/gateful/openapi/gateful.json` with Kubb.

```sh
npm run codegen
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
