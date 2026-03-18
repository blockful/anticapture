import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { DuneService } from "./service";

const API_URL = "https://api.dune.com/api/v1/query/123/results";
const API_KEY = "test-dune-api-key";
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("DuneService", () => {
  const service = new DuneService(API_URL, API_KEY);

  describe("fetchLiquidTreasury", () => {
    it("returns the parsed JSON body from a successful response", async () => {
      const responseBody = {
        result: {
          rows: [{ dao: "Uniswap", total_usd: 1000000 }],
        },
      };

      server.use(http.get(API_URL, () => HttpResponse.json(responseBody)));

      const result = await service.fetchLiquidTreasury(100);

      expect(result).toEqual(responseBody);
    });

    it("sends the X-Dune-API-Key header", async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(API_URL, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ result: { rows: [] } });
        }),
      );

      await service.fetchLiquidTreasury(10);

      expect(capturedHeaders?.get("X-Dune-API-Key")).toBe(API_KEY);
    });

    it("throws HTTPException(503) when response is not ok", async () => {
      server.use(
        http.get(
          API_URL,
          () =>
            new HttpResponse(null, {
              status: 500,
              statusText: "Internal Server Error",
            }),
        ),
      );

      await expect(service.fetchLiquidTreasury(10)).rejects.toMatchObject({
        status: 503,
      });
    });

    it("throws HTTPException(503) when response has 404 status", async () => {
      server.use(
        http.get(
          API_URL,
          () =>
            new HttpResponse(null, { status: 404, statusText: "Not Found" }),
        ),
      );

      await expect(service.fetchLiquidTreasury(10)).rejects.toMatchObject({
        status: 503,
      });
    });

    it("throws HTTPException(503) when network error occurs", async () => {
      server.use(http.get(API_URL, () => HttpResponse.error()));

      await expect(service.fetchLiquidTreasury(10)).rejects.toMatchObject({
        status: 503,
      });
    });
  });
});
