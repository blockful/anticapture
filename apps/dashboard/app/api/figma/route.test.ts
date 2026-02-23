/**
 * Security tests for Figma API proxy
 *
 * These tests verify that the Figma token is properly protected:
 * - Token is never exposed to the client
 * - Token is only accessible server-side
 * - No hardcoded tokens in code
 */

import { NextRequest } from "next/server";

// eslint-disable-next-line no-restricted-imports
import { GET } from "./route";

// Mock environment variables
const originalEnv = process.env;

describe("Figma API Route Security", () => {
  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("Token Protection", () => {
    it("should not expose token in error messages", async () => {
      // Set a test token
      process.env.FIGMA_TOKEN = "figd_test_token_12345";

      const request = new NextRequest(
        "http://localhost:3000/api/figma?fileId=invalid",
      );

      const response = await GET(request);
      const data = await response.json();

      // Verify token is never in the response
      expect(JSON.stringify(data)).not.toContain("figd_test_token_12345");
      expect(JSON.stringify(data)).not.toContain("FIGMA_TOKEN");
    });

    it("should return 500 error when token is missing", async () => {
      // Remove token
      delete process.env.FIGMA_TOKEN;

      const request = new NextRequest(
        "http://localhost:3000/api/figma?fileId=DEKMQifA8YOb3oxznHboSY",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Figma service is not configured");
      // Verify token is not mentioned in error
      expect(JSON.stringify(data)).not.toContain("FIGMA_TOKEN");
    });

    it("should use server-side environment variable", async () => {
      const testToken = "figd_server_side_token_only";
      process.env.FIGMA_TOKEN = testToken;

      // Mock fetch to avoid actual API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: "Test File", document: {} }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/figma?fileId=DEKMQifA8YOb3oxznHboSY",
      );

      await GET(request);

      // Verify fetch was called with token from process.env
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("api.figma.com"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Figma-Token": testToken,
          }),
        }),
      );
    });
  });

  describe("Input Validation", () => {
    beforeEach(() => {
      process.env.FIGMA_TOKEN = "figd_test_token";
    });

    it("should reject invalid fileId", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/figma?fileId=<script>alert('xss')</script>",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or missing fileId parameter");
    });

    it("should reject missing fileId", async () => {
      const request = new NextRequest("http://localhost:3000/api/figma");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid or missing fileId parameter");
    });

    it("should accept valid fileId", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: "Test", document: {} }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/figma?fileId=DEKMQifA8YOb3oxznHboSY",
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Rate Limiting", () => {
    beforeEach(() => {
      process.env.FIGMA_TOKEN = "figd_test_token";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: "Test", document: {} }),
      });
    });

    it("should enforce rate limiting", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/figma?fileId=DEKMQifA8YOb3oxznHboSY",
        {
          headers: {
            "x-forwarded-for": "192.168.1.1",
          },
        },
      );

      // Make many requests rapidly
      const requests = Array.from({ length: 35 }, () => GET(request));
      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const has429 = responses.some((r) => r.status === 429);
      expect(has429).toBe(true);
    });
  });

  describe("Response Sanitization", () => {
    beforeEach(() => {
      process.env.FIGMA_TOKEN = "figd_test_token";
    });

    it("should only return safe fields", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: "Test File",
          lastModified: "2024-01-01",
          version: "123",
          document: { type: "DOCUMENT" },
          // Sensitive fields that should be filtered
          thumbnailUrl: "https://example.com/secret",
          linkAccess: "private",
          editorType: "figma",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/figma?fileId=DEKMQifA8YOb3oxznHboSY",
      );

      const response = await GET(request);
      const data = await response.json();

      // Should only contain safe fields
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("lastModified");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("document");
      // Should not contain sensitive fields
      expect(data).not.toHaveProperty("thumbnailUrl");
      expect(data).not.toHaveProperty("linkAccess");
    });
  });
});
