import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { resolveGatefulOpenApiSpecUrl } from "./gateful-openapi-spec.mjs";

// Always read from the live spec URLs — never a local committed file — so docs
// and codegen generate from the same source. The Gateful resolver is a local
// inline copy (see gateful-openapi-spec.mjs) because this script runs in a
// turbo-pruned image without the sibling @anticapture/client package.
const GATEFUL_SOURCE = resolveGatefulOpenApiSpecUrl();

// The Webhook Notification API is a standalone service (not part of this
// monorepo); its spec is served from a stable public domain in every
// environment, overridable for local testing.
const WEBHOOK_SOURCE =
  process.env.WEBHOOK_OPENAPI_SPEC_URL?.trim() ||
  "https://webhook.anticapture.com/docs/json";

// Output: filtered copies the OpenAPI plugin instances generate from.
// Gitignored and regenerated on every build (see docusaurus.config.ts).
const OUT_DIR = new URL("../openapi/", import.meta.url);
const GATEFUL_OUT = new URL("gateful.json", OUT_DIR);
const WEBHOOK_OUT = new URL("webhook.json", OUT_DIR);

// Relayer endpoints are not part of the public API surface, so they are
// excluded from the generated reference. Everything under the `/relay/` path
// segment is dropped: relayVote, relayDelegate, and the relayer
// config/rate-limit/balance helpers (which are tagged `system`, so a tag-based
// filter would miss them).
const isRelayPath = (p) => p.split("/").includes("relay");

// `skip-pagination` is an internal marker tag (it flags operations whose list
// responses skip pagination), not a domain group. Left in, the docs sidebar
// grows a "skip-pagination" category duplicating 25 operations from their real
// groups — so it is stripped from every operation and the tag list.
const INTERNAL_TAGS = new Set(["skip-pagination"]);

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

// The OpenAPI docs plugin refuses operations without a summary or
// operationId (the webhook spec declares neither). Derive stable fallbacks:
// operationId from the method + path, summary from the description's first
// sentence.
const ensureOperationMetadata = (spec) => {
  for (const [path, operations] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(operations)) {
      if (!HTTP_METHODS.has(method)) continue;

      operation.operationId ??= [
        method,
        ...path.split("/").filter((s) => s && !s.startsWith("{")),
      ].join("-");
      operation.summary ??=
        operation.description?.match(/^[^.\n]+/)?.[0].trim() ??
        `${method.toUpperCase()} ${path}`;
    }
  }
};

const readSpec = async (source) => {
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(
      `Unable to fetch OpenAPI spec from ${source}: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

const stripInternalTags = (spec) => {
  let stripped = 0;

  for (const operations of Object.values(spec.paths ?? {})) {
    for (const operation of Object.values(operations)) {
      if (!Array.isArray(operation?.tags)) continue;

      const kept = operation.tags.filter((t) => !INTERNAL_TAGS.has(t));
      stripped += operation.tags.length - kept.length;
      operation.tags = kept;
    }
  }

  if (Array.isArray(spec.tags)) {
    spec.tags = spec.tags.filter((t) => !INTERNAL_TAGS.has(t?.name));
  }

  return stripped;
};

const writeSpec = async (out, spec) =>
  writeFile(out, JSON.stringify(spec, null, 2) + "\n");

await mkdir(fileURLToPath(OUT_DIR), { recursive: true });

// Gateful: drop relayer endpoints, then internal marker tags.
const gateful = await readSpec(GATEFUL_SOURCE);

const before = Object.keys(gateful.paths).length;
gateful.paths = Object.fromEntries(
  Object.entries(gateful.paths).filter(([p]) => !isRelayPath(p)),
);
const removedPaths = before - Object.keys(gateful.paths).length;

if (Array.isArray(gateful.tags)) {
  gateful.tags = gateful.tags.filter((t) => t?.name !== "relay");
}

const strippedTags = stripInternalTags(gateful);

// A few operations (e.g. GET /{dao}/health) ship without operationId/summary,
// which the docs plugin refuses to render.
ensureOperationMetadata(gateful);

await writeSpec(GATEFUL_OUT, gateful);
console.log(
  `[prepare-spec] read ${GATEFUL_SOURCE}; removed ${removedPaths} relayer path(s); stripped ${strippedTags} internal tag reference(s); wrote ${fileURLToPath(GATEFUL_OUT)}`,
);

// Webhook: no internal surface to filter, but its operations lack the
// summary/operationId metadata the docs plugin requires.
const webhook = await readSpec(WEBHOOK_SOURCE);

ensureOperationMetadata(webhook);

await writeSpec(WEBHOOK_OUT, webhook);
console.log(
  `[prepare-spec] read ${WEBHOOK_SOURCE}; wrote ${fileURLToPath(WEBHOOK_OUT)}`,
);
