import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  ComponentsObject,
  OpenAPIObject,
  ParameterObject,
  PathItemObject,
  PathsObject,
} from "openapi3-ts/oas31";

import { logger } from "./logger.js";

type Schemas = NonNullable<ComponentsObject["schemas"]>;

async function fetchDoc(
  name: string,
  baseUrl: string,
  docsPath = "/docs",
): Promise<OpenAPIObject | null> {
  try {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    const normalizedDocsPath = docsPath.startsWith("/")
      ? docsPath
      : `/${docsPath}`;
    const res = await fetch(`${normalizedBaseUrl}${normalizedDocsPath}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as OpenAPIObject;
  } catch (err) {
    logger.warn({ err, name }, "failed to fetch upstream OpenAPI spec");
    return null;
  }
}

function mergeSchemas(docs: OpenAPIObject[]): Schemas {
  const schemas: Schemas = {};
  for (const doc of docs) {
    if (doc.components?.schemas) {
      Object.assign(schemas, doc.components.schemas);
    }
  }
  return schemas;
}

function mergeAddressEnrichmentPaths(doc: OpenAPIObject): PathsObject {
  const paths: PathsObject = {};

  if (!doc.paths) return paths;

  for (const [path, pathItem] of Object.entries(doc.paths)) {
    const prefixedPath =
      path === "/"
        ? "/address-enrichment"
        : `/address-enrichment${path.startsWith("/") ? path : `/${path}`}`;
    paths[prefixedPath] = { ...pathItem };
  }

  return paths;
}

/**
 * Relayers across DAOs share a single contract, so one fetched spec
 * is enough — the dao enum comes straight from the configured map.
 */
function mergeRelayerPaths(doc: OpenAPIObject, daos: string[]): PathsObject {
  if (!doc.paths) return {};

  const daoParam: ParameterObject = {
    name: "dao",
    in: "path",
    required: true,
    schema: { type: "string", enum: [...daos].sort() },
    description: "DAO identifier",
  };

  const paths: PathsObject = {};
  for (const [path, pathItem] of Object.entries(doc.paths)) {
    const item: PathItemObject = { ...pathItem };
    item.parameters = [daoParam, ...(item.parameters ?? [])];
    paths[`/{dao}${path.startsWith("/") ? path : `/${path}`}`] = item;
  }
  return paths;
}

function mergePaths(docs: OpenAPIObject[], daoNames: string[]): PathsObject {
  const paths: PathsObject = {};

  // 1. Collect which DAOs support each path
  const pathDaoMap = new Map<string, Set<string>>();
  const pathItems = new Map<string, PathItemObject>();

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const daoName = daoNames[i];
    if (!doc.paths) continue;

    for (const [path, pathItem] of Object.entries(doc.paths)) {
      if (!pathDaoMap.has(path)) {
        pathDaoMap.set(path, new Set());
        pathItems.set(path, { ...pathItem });
      }
      pathDaoMap.get(path)!.add(daoName);
    }
  }

  // 2. Build merged paths with per-path dao enum
  for (const [path, supportedDaos] of pathDaoMap) {
    const daoParam: ParameterObject = {
      name: "dao",
      in: "path",
      required: true,
      schema: { type: "string", enum: [...supportedDaos].sort() },
      description: "DAO identifier",
    };

    const item = pathItems.get(path)!;
    item.parameters = [daoParam, ...(item.parameters ?? [])];
    paths[`/{dao}${path}`] = item;
  }

  return paths;
}

/**
 * Fetches upstream OpenAPI specs and merges them with the gateway's own spec.
 */
export async function mergeUpstreamDocs(
  ownSpec: OpenAPIObject,
  daoApis: Map<string, string>,
  addressEnrichmentUrl?: string,
  daoRelayers?: Map<string, string>,
): Promise<OpenAPIObject> {
  const entries = Array.from(daoApis.entries());
  const relayerEntries = Array.from(daoRelayers?.entries() ?? []);
  const [results, addressEnrichmentDoc, relayerResults] = await Promise.all([
    Promise.all(entries.map(([name, url]) => fetchDoc(name, url))),
    addressEnrichmentUrl
      ? fetchDoc("address-enrichment", addressEnrichmentUrl, "/docs/json")
      : Promise.resolve(null),
    Promise.all(relayerEntries.map(([name, url]) => fetchDoc(name, url))),
  ]);

  // Keep only successful fetches, with matching names
  const docs: OpenAPIObject[] = [];
  const daoNames: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result !== null) {
      docs.push(result);
      daoNames.push(entries[i][0]);
    }
  }

  // All relayers share one schema — first reachable spec wins; enum
  // is the configured DAO set.
  const relayerDoc = relayerResults.find((r) => r !== null) ?? null;
  const relayerDaoNames = relayerEntries.map(([name]) => name);

  const schemaDocs = [
    ...docs,
    ...(addressEnrichmentDoc ? [addressEnrichmentDoc] : []),
    ...(relayerDoc ? [relayerDoc] : []),
  ];

  return {
    ...ownSpec,
    paths: {
      ...ownSpec.paths,
      ...mergePaths(docs, daoNames),
      ...(addressEnrichmentDoc
        ? mergeAddressEnrichmentPaths(addressEnrichmentDoc)
        : {}),
      ...(relayerDoc ? mergeRelayerPaths(relayerDoc, relayerDaoNames) : {}),
    },
    components: {
      ...ownSpec.components,
      schemas: {
        ...ownSpec.components?.schemas,
        ...mergeSchemas(schemaDocs),
      },
    },
  };
}

/**
 * Stores the merged OpenAPI spec locally.
 */
export function storeOpenApiSpec(
  ownSpec: OpenAPIObject,
  daoApis: Map<string, string>,
  addressEnrichmentUrl?: string,
  outputPath = join(process.cwd(), "openapi", "gateful.json"),
  daoRelayers?: Map<string, string>,
): () => Promise<OpenAPIObject> {
  return async () => {
    const spec = await mergeUpstreamDocs(
      ownSpec,
      daoApis,
      addressEnrichmentUrl,
      daoRelayers,
    );

    try {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
    } catch (err) {
      logger.warn({ err }, "failed to store OpenAPI spec");
    }

    return spec;
  };
}
