import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  ComponentsObject,
  OpenAPIObject,
  ParameterObject,
  PathItemObject,
  PathsObject,
} from "openapi3-ts/oas31";

type Schemas = NonNullable<ComponentsObject["schemas"]>;

async function fetchDoc(
  name: string,
  baseUrl: string,
): Promise<OpenAPIObject | null> {
  try {
    const res = await fetch(`${baseUrl}/docs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as OpenAPIObject;
  } catch (err) {
    console.warn(`[upstream-docs] Failed to fetch ${name}:`, err);
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
): Promise<OpenAPIObject> {
  const entries = Array.from(daoApis.entries());
  const results = await Promise.all(
    entries.map(([name, url]) => fetchDoc(name, url)),
  );

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

  return {
    ...ownSpec,
    paths: { ...ownSpec.paths, ...mergePaths(docs, daoNames) },
    components: {
      ...ownSpec.components,
      schemas: {
        ...ownSpec.components?.schemas,
        ...mergeSchemas(docs),
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
  outputPath = join(process.cwd(), "openapi", "gateful.json"),
): () => Promise<OpenAPIObject> {
  return async () => {
    const spec = await mergeUpstreamDocs(ownSpec, daoApis);

    try {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
    } catch (err) {
      console.warn("[upstream-docs] Failed to store OpenAPI spec:", err);
    }

    return spec;
  };
}
