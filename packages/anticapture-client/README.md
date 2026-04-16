# @anticapture/client

TypeScript SDK for the Anticapture Gateful API.

## Installation

```sh
npm install @anticapture/client
```

React Query hooks are available from the `@anticapture/client/hooks` subpath:

```ts
import { getDaos } from "@anticapture/client";
import { useGetDaos } from "@anticapture/client/hooks";
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
- For GitHub Actions publishing, the repository has an `NPM_TOKEN` secret with publish access.

Manual publish:

```sh
npm login
npm run build
npm publish
```

`prepack` runs `npm run build` before `npm pack` and `npm publish`, so the tarball is generated from a fresh OpenAPI SDK build.

Automated publish:

Create a tag that starts with `client-v`, for example:

```sh
git tag client-v1.0.0
git push origin client-v1.0.0
```

The publish workflow can also be run manually from GitHub Actions.
