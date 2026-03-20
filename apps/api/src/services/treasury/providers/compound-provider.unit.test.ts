import axios from "axios";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from "vitest";
import { HTTPException } from "hono/http-exception";
import { CompoundProvider, CompoundResponse } from "./compound-provider";

const BASE_URL = "http://compound.test.com";
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createMockCompoundResponse = (
  data: CompoundResponse["data"] = [],
): CompoundResponse => ({
  data,
  meta: { limit: 36500, offset: 0, total: data.length },
});

describe("CompoundProvider", () => {
  let provider: CompoundProvider;

  beforeEach(() => {
    provider = new CompoundProvider(axios.create({ baseURL: BASE_URL }));
  });

  it("should fetch and transform data excluding COMP tokens", async () => {
    server.use(
      http.get(`${BASE_URL}/treasury`, () =>
        HttpResponse.json(
          createMockCompoundResponse([
            { id: 1, q: "a", p: 1, v: 1000, d: 1700000000, sId: 1 }, // not COMP
            { id: 2, q: "b", p: 1, v: 500, d: 1700000000, sId: 7 }, // COMP token (excluded)
          ]),
        ),
      ),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toEqual([{ date: 1700000000, liquidTreasury: 1000 }]);
  });

  it("should aggregate same-timestamp entries", async () => {
    server.use(
      http.get(`${BASE_URL}/treasury`, () =>
        HttpResponse.json(
          createMockCompoundResponse([
            { id: 1, q: "a", p: 1, v: 1000, d: 1700000000, sId: 1 },
            { id: 2, q: "b", p: 1, v: 500, d: 1700000000, sId: 2 },
          ]),
        ),
      ),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toEqual([{ date: 1700000000, liquidTreasury: 1500 }]);
  });

  it("should apply cutoff filter", async () => {
    server.use(
      http.get(`${BASE_URL}/treasury`, () =>
        HttpResponse.json(
          createMockCompoundResponse([
            { id: 1, q: "a", p: 1, v: 1000, d: 1600000000, sId: 1 },
            { id: 2, q: "b", p: 1, v: 2000, d: 1700000000, sId: 2 },
          ]),
        ),
      ),
    );

    const result = await provider.fetchTreasury(1700000000);

    expect(result).toEqual([{ date: 1700000000, liquidTreasury: 2000 }]);
  });

  it("should fallback to last item when all filtered out", async () => {
    server.use(
      http.get(`${BASE_URL}/treasury`, () =>
        HttpResponse.json(
          createMockCompoundResponse([
            { id: 1, q: "a", p: 1, v: 1000, d: 1600000000, sId: 1 },
            { id: 2, q: "b", p: 1, v: 2000, d: 1650000000, sId: 2 },
          ]),
        ),
      ),
    );

    const result = await provider.fetchTreasury(1800000000);

    expect(result).toEqual([{ date: 1650000000, liquidTreasury: 2000 }]);
  });

  it("should cache after first fetch", async () => {
    let callCount = 0;
    server.use(
      http.get(`${BASE_URL}/treasury`, () => {
        callCount++;
        return HttpResponse.json(
          createMockCompoundResponse([
            { id: 1, q: "a", p: 1, v: 1000, d: 1700000000, sId: 1 },
          ]),
        );
      }),
    );

    await provider.fetchTreasury(0);
    await provider.fetchTreasury(0);

    expect(callCount).toBe(1);
  });

  it("should throw HTTPException on error", async () => {
    server.use(http.get(`${BASE_URL}/treasury`, () => HttpResponse.error()));

    await expect(provider.fetchTreasury(0)).rejects.toThrow(HTTPException);
  });

  it("should handle empty data", async () => {
    server.use(
      http.get(`${BASE_URL}/treasury`, () =>
        HttpResponse.json(createMockCompoundResponse([])),
      ),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toHaveLength(0);
  });
});
