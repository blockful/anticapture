import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { OpenAPIObject } from "openapi3-ts/oas31";
import { vi } from "vitest";

import { storeOpenApiSpec } from "./upstream-docs";

describe("storeOpenApiSpec", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gateful-openapi-"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    return rm(tempDir, { force: true, recursive: true });
  });

  it("stores the merged OpenAPI spec locally", async () => {
    const ownSpec: OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Gateway", version: "1.0.0" },
      paths: {},
    };
    const upstreamSpec: OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "DAO API", version: "1.0.0" },
      paths: {
        "/proposals": {
          get: {
            responses: {
              "200": { description: "OK" },
            },
          },
        },
      },
    };

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(upstreamSpec), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const outputPath = join(tempDir, "openapi", "gateful.json");
    const getOpenApiSpec = storeOpenApiSpec(
      ownSpec,
      new Map([["uni", "http://uni-api"]]),
      outputPath,
    );

    const first = await getOpenApiSpec();
    const second = await getOpenApiSpec();
    const stored = JSON.parse(
      await readFile(outputPath, "utf8"),
    ) as OpenAPIObject;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(second.paths).toHaveProperty("/{dao}/proposals");
    expect(stored.paths).toHaveProperty("/{dao}/proposals");
  });
});
