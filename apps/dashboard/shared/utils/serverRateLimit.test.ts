import { checkRateLimit } from "@/shared/utils/serverRateLimit";

const KV_ENV = {
  KV_REST_API_URL: "https://kv.example.com",
  KV_REST_API_TOKEN: "token",
};

const originalEnv = { ...process.env };

const mockPipelineResponse = (count: number) =>
  jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ result: count }, { result: 1 }],
  });

describe("checkRateLimit", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  describe("with a durable store configured", () => {
    beforeEach(() => {
      process.env = { ...originalEnv, ...KV_ENV };
    });

    test("allows requests while the shared counter is within the limit", async () => {
      global.fetch = mockPipelineResponse(5);

      const allowed = await checkRateLimit({
        key: "test:1.2.3.4",
        windowSeconds: 3600,
        maxRequests: 5,
      });

      expect(allowed).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://kv.example.com/pipeline",
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer token" },
        }),
      );
    });

    test("blocks requests once the shared counter exceeds the limit", async () => {
      global.fetch = mockPipelineResponse(6);

      const allowed = await checkRateLimit({
        key: "test:1.2.3.4",
        windowSeconds: 3600,
        maxRequests: 5,
      });

      expect(allowed).toBe(false);
    });

    test("falls back to in-memory counting when the store is unreachable", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
      jest.spyOn(console, "error").mockImplementation(() => {});

      const key = `fallback:${Math.random()}`;
      const options = { key, windowSeconds: 3600, maxRequests: 2 };

      expect(await checkRateLimit(options)).toBe(true);
      expect(await checkRateLimit(options)).toBe(true);
      expect(await checkRateLimit(options)).toBe(false);
    });
  });

  describe("without a durable store configured", () => {
    beforeEach(() => {
      process.env = { ...originalEnv };
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    test("counts in memory and blocks past the limit", async () => {
      global.fetch = jest.fn();

      const key = `memory:${Math.random()}`;
      const options = { key, windowSeconds: 3600, maxRequests: 1 };

      expect(await checkRateLimit(options)).toBe(true);
      expect(await checkRateLimit(options)).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
