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

    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(upstreamSpec), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const outputPath = join(tempDir, "openapi", "gateful.json");
    const getOpenApiSpec = storeOpenApiSpec(
      ownSpec,
      new Map([["uni", "http://uni-api"]]),
      undefined,
      outputPath,
    );

    const first = await getOpenApiSpec();
    const second = await getOpenApiSpec();
    const stored = JSON.parse(
      await readFile(outputPath, "utf8"),
    ) as OpenAPIObject;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first).not.toBe(second);
    expect(second.paths).toHaveProperty("/{dao}/proposals");
    expect(stored.paths).toHaveProperty("/{dao}/proposals");
  });

  it("recomputes the merged spec after transient upstream failures", async () => {
    const ownSpec: OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Gateway", version: "1.0.0" },
      paths: {},
    };
    const upstreamSpec: OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "DAO API", version: "1.0.0" },
      paths: {
        "/delegates": {
          get: {
            responses: {
              "200": { description: "OK" },
            },
          },
        },
      },
    };

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(upstreamSpec), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const outputPath = join(tempDir, "openapi", "gateful.json");
    const getOpenApiSpec = storeOpenApiSpec(
      ownSpec,
      new Map([["uni", "http://uni-api"]]),
      undefined,
      outputPath,
    );

    const first = await getOpenApiSpec();
    const second = await getOpenApiSpec();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.paths).not.toHaveProperty("/{dao}/delegates");
    expect(second.paths).toHaveProperty("/{dao}/delegates");
  });

  it("merges address enrichment docs under the address-enrichment prefix", async () => {
    const ownSpec: OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Gateway", version: "1.0.0" },
      paths: {
        "/health": {
          get: {
            responses: {
              "200": { description: "OK" },
            },
          },
        },
      },
      components: {
        schemas: {
          GatewayStatus: {
            type: "object",
            properties: {
              status: { type: "string" },
            },
          },
        },
      },
    };
    const daoSpec: OpenAPIObject = {
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
      components: {
        schemas: {
          Proposal: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          },
        },
      },
    };
    const addressEnrichmentSpec: OpenAPIObject = {
      openapi: "3.0.0",
      info: { title: "Address Enrichment API", version: "0.1.0" },
      paths: {
        "/address/{address}": {
          get: {
            responses: {
              "200": { description: "OK" },
            },
          },
        },
        "/addresses": {
          get: {
            responses: {
              "200": { description: "OK" },
            },
          },
        },
      },
      components: {
        schemas: {
          AddressEnrichment: {
            type: "object",
            properties: {
              address: { type: "string" },
            },
          },
        },
      },
    };

    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockImplementation((input: string | URL | Request) => {
        const url = input.toString();
        const body = url.endsWith("/docs/json")
          ? addressEnrichmentSpec
          : daoSpec;

        return Promise.resolve(
          new Response(JSON.stringify(body), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      });

    const outputPath = join(tempDir, "openapi", "gateful.json");
    const getOpenApiSpec = storeOpenApiSpec(
      ownSpec,
      new Map([["uni", "http://uni-api"]]),
      "http://address-api",
      outputPath,
    );

    const spec = await getOpenApiSpec();

    expect(fetchMock).toHaveBeenCalledWith("http://uni-api/docs");
    expect(fetchMock).toHaveBeenCalledWith("http://address-api/docs/json");
    expect(spec.paths).toHaveProperty("/{dao}/proposals");
    expect(spec.paths).toHaveProperty("/address-enrichment/address/{address}");
    expect(spec.paths).toHaveProperty("/address-enrichment/addresses");
    expect(spec.paths).toHaveProperty("/health");
    expect(spec.components?.schemas).toMatchObject({
      GatewayStatus: expect.any(Object),
      Proposal: expect.any(Object),
      AddressEnrichment: expect.any(Object),
    });
  });

  it("keeps the gateway spec when address enrichment docs cannot be fetched", async () => {
    const ownSpec: OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Gateway", version: "1.0.0" },
      paths: {
        "/health": {
          get: {
            responses: {
              "200": { description: "OK" },
            },
          },
        },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Unavailable", { status: 503 }),
    );

    const outputPath = join(tempDir, "openapi", "gateful.json");
    const getOpenApiSpec = storeOpenApiSpec(
      ownSpec,
      new Map(),
      "http://address-api",
      outputPath,
    );

    const spec = await getOpenApiSpec();

    expect(spec.paths).toHaveProperty("/health");
    expect(spec.paths).not.toHaveProperty(
      "/address-enrichment/address/{address}",
    );
  });
});
