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
import { DuneProvider, DuneResponse } from "./dune-provider";

const BASE_URL = "http://dune.test.com";
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createMockDuneResponse = (
  rows: { date: string; totalAssets: number }[] = [],
): DuneResponse => ({
  execution_id: "exec-1",
  query_id: 1,
  is_execution_finished: true,
  state: "QUERY_STATE_COMPLETED",
  submitted_at: "2024-01-01T00:00:00Z",
  expires_at: "2024-01-02T00:00:00Z",
  execution_started_at: "2024-01-01T00:00:00Z",
  execution_ended_at: "2024-01-01T00:01:00Z",
  result: { rows },
  next_uri: "",
  next_offset: 0,
});

describe("DuneProvider", () => {
  let provider: DuneProvider;
  const API_KEY = "test-api-key";

  beforeEach(() => {
    provider = new DuneProvider(axios.create({ baseURL: BASE_URL }), API_KEY);
  });

  it("should fetch and transform data", async () => {
    let capturedApiKey: string | null = null;
    server.use(
      http.get(`${BASE_URL}/`, ({ request }) => {
        capturedApiKey = request.headers.get("X-Dune-API-Key");
        return HttpResponse.json(
          createMockDuneResponse([
            { date: "2024-01-01", totalAssets: 1000 },
            { date: "2024-01-02", totalAssets: 2000 },
          ]),
        );
      }),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toEqual([
      { date: 1704067200, liquidTreasury: 1000 },
      { date: 1704153600, liquidTreasury: 2000 },
    ]);
    expect(capturedApiKey).toBe(API_KEY);
  });

  it("should apply cutoff filter", async () => {
    // 2024-01-01 UTC = 1704067200, 2024-01-02 UTC = 1704153600
    server.use(
      http.get(`${BASE_URL}/`, () =>
        HttpResponse.json(
          createMockDuneResponse([
            { date: "2024-01-01", totalAssets: 1000 },
            { date: "2024-01-02", totalAssets: 2000 },
          ]),
        ),
      ),
    );

    const result = await provider.fetchTreasury(1704153600);

    expect(result).toEqual([{ date: 1704153600, liquidTreasury: 2000 }]);
  });

  it("should cache after first fetch", async () => {
    let callCount = 0;
    server.use(
      http.get(`${BASE_URL}/`, () => {
        callCount++;
        return HttpResponse.json(
          createMockDuneResponse([{ date: "2024-01-01", totalAssets: 1000 }]),
        );
      }),
    );

    await provider.fetchTreasury(0);
    await provider.fetchTreasury(0);

    expect(callCount).toBe(1);
  });

  it("should throw HTTPException on error", async () => {
    server.use(http.get(`${BASE_URL}/`, () => HttpResponse.error()));

    await expect(provider.fetchTreasury(0)).rejects.toThrow(HTTPException);
  });

  it("should handle empty rows", async () => {
    server.use(
      http.get(`${BASE_URL}/`, () =>
        HttpResponse.json(createMockDuneResponse([])),
      ),
    );

    const result = await provider.fetchTreasury(0);

    expect(result).toHaveLength(0);
  });

  it("should transform date strings to timestamps correctly", async () => {
    server.use(
      http.get(`${BASE_URL}/`, () =>
        HttpResponse.json(
          createMockDuneResponse([{ date: "2024-06-15", totalAssets: 500 }]),
        ),
      ),
    );

    const result = await provider.fetchTreasury(0);

    // 2024-06-15 UTC midnight = 1718409600
    expect(result).toEqual([{ date: 1718409600, liquidTreasury: 500 }]);
  });
});
