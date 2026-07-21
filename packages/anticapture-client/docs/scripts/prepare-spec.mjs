import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { resolveGatefulOpenApiSpecUrl } from "./gateful-openapi-spec.mjs";

// Always read from the live spec URLs - never a local committed file - so docs
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
// groups - so it is stripped from every operation and the tag list.
const INTERNAL_TAGS = new Set(["skip-pagination"]);

// Human-readable category labels for the generated API sidebar, in display
// order (domain groups first, plumbing last). Tags found in the spec but not
// listed here fall back to title-cased names, appended at the end.
const GATEFUL_TAG_ORDER = [
  ["governance", "Governance"],
  ["proposals", "Proposals"],
  ["votes", "Votes"],
  ["voting-power", "Voting Power"],
  ["delegations", "Delegations"],
  ["tokens", "Tokens"],
  ["account-balances", "Account Balances"],
  ["transfers", "Transfers"],
  ["treasury", "Treasury"],
  ["revenue", "Revenue"],
  ["metrics", "Metrics"],
  ["feed", "Feed"],
  ["offchain", "Offchain"],
  ["address", "Address"],
  ["system", "System"],
];

const WEBHOOK_TAG_ORDER = [["webhooks", "Webhooks"]];

// The webhook spec has no summaries; its descriptions are full paragraphs, so
// derived first-sentence summaries make unwieldy sidebar labels. Keep these
// short and imperative.
const WEBHOOK_SUMMARIES = new Map([
  ["post /webhooks", "Register a webhook"],
  ["delete /webhooks", "Deactivate a webhook"],
]);

const titleCase = (tag) =>
  tag
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

// Rewrite `spec.tags` as the ordered, labelled list the docs sidebar groups
// by: the OpenAPI plugin renders categories in spec-tag order and uses
// `x-displayName` as the category label.
const applyTagMetadata = (spec, order) => {
  const used = new Set();

  for (const operations of Object.values(spec.paths ?? {})) {
    for (const operation of Object.values(operations)) {
      if (Array.isArray(operation?.tags)) {
        for (const tag of operation.tags) used.add(tag);
      }
    }
  }

  const ordered = [
    ...order.filter(([name]) => used.has(name)),
    ...[...used]
      .filter((name) => !order.some(([ordered_name]) => ordered_name === name))
      .sort()
      .map((name) => [name, titleCase(name)]),
  ];

  spec.tags = ordered.map(([name, label]) => ({
    name,
    "x-displayName": label,
  }));
};

const applySummaryOverrides = (spec, overrides) => {
  for (const [path, operations] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(operations)) {
      const summary = overrides.get(`${method} ${path}`);

      if (summary) operation.summary = summary;
    }
  }
};

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
// operationId (the webhook spec declares neither), and renders untagged
// operations under a literal "UNTAGGED" category. Derive stable fallbacks:
// operationId from the method + path, summary from the description's first
// sentence, and `defaultTag` for tagless operations (e.g. GET /{dao}/health).
const ensureOperationMetadata = (spec, defaultTag) => {
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

      if (!Array.isArray(operation.tags) || operation.tags.length === 0) {
        operation.tags = [defaultTag];
      }
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
ensureOperationMetadata(gateful, "system");
applyTagMetadata(gateful, GATEFUL_TAG_ORDER);

// Neither spec declares `servers`, so generated request samples would fall
// back to the docs site's own origin as the base URL. Derive the host from
// the URL the spec was fetched from, so preview/dev builds document and call
// the same environment they validated (not production).
const gatefulOrigin = new URL(GATEFUL_SOURCE).origin;
gateful.servers = [{ url: gatefulOrigin }];

// Public-facing naming and copy for the generated reference landing page -
// "Gateful" is the internal service name, and the upstream spec ships no
// description.
gateful.info.title = "Anticapture REST API";
gateful.info.description ||=
  "REST API for Anticapture's DAO governance analytics: proposals, votes, " +
  "voting power, delegations, token and treasury data, indexed from onchain " +
  "and offchain sources.\n\nAll endpoints are served from " +
  `\`${gatefulOrigin}\` and require a bearer token; see ` +
  "[Getting started](/getting-started).";

await writeSpec(GATEFUL_OUT, gateful);
console.log(
  `[prepare-spec] read ${GATEFUL_SOURCE}; removed ${removedPaths} relayer path(s); stripped ${strippedTags} internal tag reference(s); wrote ${fileURLToPath(GATEFUL_OUT)}`,
);

// Webhook: no internal surface to filter, but its operations lack the
// summary/operationId metadata the docs plugin requires.
const webhook = await readSpec(WEBHOOK_SOURCE);

webhook.servers = [{ url: new URL(WEBHOOK_SOURCE).origin }];

applySummaryOverrides(webhook, WEBHOOK_SUMMARIES);
ensureOperationMetadata(webhook, "webhooks");
applyTagMetadata(webhook, WEBHOOK_TAG_ORDER);

await writeSpec(WEBHOOK_OUT, webhook);
console.log(
  `[prepare-spec] read ${WEBHOOK_SOURCE}; wrote ${fileURLToPath(WEBHOOK_OUT)}`,
);
