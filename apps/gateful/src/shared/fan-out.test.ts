import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { CircuitBreakerRegistry } from "./circuit-breaker-registry";
import { fanOutGet } from "./fan-out";

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const server = setupServer();
const registry = new CircuitBreakerRegistry();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// fanOutGet
// ---------------------------------------------------------------------------

describe("fanOutGet", () => {
  it("skips a DAO whose route breaker is already open, without calling it", async () => {
    // Only uni may be hit: an ens request would trip onUnhandledRequest.
    server.use(
      http.get("http://uni-api/dao", () => HttpResponse.json({ id: "uni" })),
    );
    const isolated = new CircuitBreakerRegistry({
      consecutiveFailureThreshold: 1,
    });
    // An earlier fan-out tripped ens's /dao circuit. Fan-out keys are its own,
    // so this is the breaker a later fan-out reads.
    await expect(
      isolated.forFanOut("ens", "/dao").execute(async () => {
        throw new Error("upstream down");
      }),
    ).rejects.toThrow("upstream down");
    expect(isolated.getAll().get("fanout:ens:dao")?.state).toBe("OPEN");

    const daoApis = new Map([
      ["ens", "http://ens-api"],
      ["uni", "http://uni-api"],
    ]);
    const result = await fanOutGet(daoApis, isolated, "/dao");

    // ens was skipped without a request: msw is set to error on any call to it.
    expect(result.data).toEqual(new Map([["uni", { id: "uni" }]]));
    // The proxy route of the same path never saw the fan-out failure.
    expect(isolated.getAll().has("ens:dao")).toBe(false);
  });

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

    const result = await fanOutGet(daoApis, registry, "/dao");

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

    const result = await fanOutGet(daoApis, registry, "/dao");

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

    const result = await fanOutGet(daoApis, registry, "/dao");

    expect(result).toEqual({
      data: new Map([["uni", { id: "uni" }]]),
      cacheControl: "public, max-age=30",
    });
  });
});
