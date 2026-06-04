import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { resolveGatefulOpenApiSpec } from "../../src/gateful-openapi-spec.ts";

const CLIENT_PACKAGE_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const SOURCE = resolveGatefulOpenApiSpec({
  packageDirectory: CLIENT_PACKAGE_DIRECTORY,
});
// Output: a filtered copy the OpenAPI plugin generates from. Gitignored and
// regenerated on every build (see docusaurus.config.ts `GATEFUL_SPEC`).
const OUT = new URL("../openapi/gateful.json", import.meta.url);

// Relayer endpoints are not supported through the MCP, so they are excluded
// from the generated reference. Everything under the `/relay/` path segment is
// dropped: relayVote, relayDelegate, and the relayer config/rate-limit/balance
// helpers (which are tagged `system`, so a tag-based filter would miss them).
const isRelayPath = (p) => p.split("/").includes("relay");

const readSpec = async (source) => {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(
        `Unable to fetch Gateful OpenAPI spec from ${source}: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  return JSON.parse(await readFile(source, "utf8"));
};

const spec = await readSpec(SOURCE);

const before = Object.keys(spec.paths).length;
spec.paths = Object.fromEntries(
  Object.entries(spec.paths).filter(([p]) => !isRelayPath(p)),
);
const removed = before - Object.keys(spec.paths).length;

// Drop the now-unused `relay` tag definition, if the spec declares one.
if (Array.isArray(spec.tags)) {
  spec.tags = spec.tags.filter((t) => t?.name !== "relay");
}

await mkdir(dirname(fileURLToPath(OUT)), { recursive: true });
await writeFile(OUT, JSON.stringify(spec, null, 2) + "\n");

console.log(
  `[prepare-spec] read ${SOURCE}; removed ${removed} relayer path(s); wrote ${fileURLToPath(OUT)}`,
);
