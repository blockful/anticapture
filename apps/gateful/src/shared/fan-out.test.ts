import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { fanOutGet } from "./fan-out";

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// fanOutGet
// ---------------------------------------------------------------------------

describe("fanOutGet", () => {
  it("returns data from all upstreams and cacheControl from the first fulfilled", async () => {
    server.use(
      http.get("http://ens-api/dao", () =>
        HttpResponse.json(
          { id: "ens" },
          { headers: { "Cache-Control": "public, max-age=120" } },
        ),
      ),
      http.get("http://uni-api/dao", () =>
        HttpResponse.json(
          { id: "uni" },
          { headers: { "Cache-Control": "public, max-age=120" } },
        ),
      ),
    );

    const daoApis = new Map([
      ["ens", "http://ens-api"],
      ["uni", "http://uni-api"],
    ]);

    const result = await fanOutGet(daoApis, "/dao");

    expect(result).toEqual({
      data: new Map([
        ["ens", { id: "ens" }],
        ["uni", { id: "uni" }],
      ]),
      cacheControl: "public, max-age=120",
    });
  });

  it("returns null cacheControl when all upstreams omit Cache-Control header", async () => {
    server.use(
      http.get("http://ens-api/dao", () => HttpResponse.json({ id: "ens" })),
      http.get("http://uni-api/dao", () => HttpResponse.json({ id: "uni" })),
    );

    const daoApis = new Map([
      ["ens", "http://ens-api"],
      ["uni", "http://uni-api"],
    ]);

    const result = await fanOutGet(daoApis, "/dao");

    expect(result).toEqual({
      data: new Map([
        ["ens", { id: "ens" }],
        ["uni", { id: "uni" }],
      ]),
      cacheControl: null,
    });
  });

  it("excludes failed upstreams from results", async () => {
    server.use(
      http.get("http://ens-api/dao", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
      http.get("http://uni-api/dao", () =>
        HttpResponse.json(
          { id: "uni" },
          { headers: { "Cache-Control": "public, max-age=30" } },
        ),
      ),
    );

    const daoApis = new Map([
      ["ens", "http://ens-api"],
      ["uni", "http://uni-api"],
    ]);

    const result = await fanOutGet(daoApis, "/dao");

    expect(result).toEqual({
      data: new Map([["uni", { id: "uni" }]]),
      cacheControl: "public, max-age=30",
    });
  });
});
