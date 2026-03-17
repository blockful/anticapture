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
  const seen = new Set<string>();

  const daoParam: ParameterObject = {
    name: "dao",
    in: "path",
    required: true,
    schema: { type: "string", enum: daoNames },
    description: "DAO identifier",
  };

  for (const doc of docs) {
    if (!doc.paths) continue;

    for (const [path, pathItem] of Object.entries(doc.paths)) {
      if (seen.has(path)) continue;
      seen.add(path);

      const enrichedItem: PathItemObject = { ...pathItem };
      enrichedItem.parameters = [daoParam, ...(enrichedItem.parameters ?? [])];

      paths[`/{dao}${path}`] = enrichedItem;
    }
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

  const docs = results.filter((doc): doc is OpenAPIObject => doc !== null);
  const daoNames = Array.from(daoApis.keys());

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
