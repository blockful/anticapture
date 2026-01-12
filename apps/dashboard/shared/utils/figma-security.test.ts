/**
 * Security tests for Figma utilities
 *
 * Verifies that tokens are never exposed in client-side code
 */

import fs from "fs";
import path from "path";

import { getFigmaDesignConfig } from "./figma-storybook";
import { fetchFigmaFile } from "./figma";

describe("Figma Utilities Security", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Token Exposure Prevention", () => {
    it("should not expose token in client-side bundle when undefined", () => {
      delete process.env.FIGMA_TOKEN;

      const config = getFigmaDesignConfig(
        "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/Test",
      );

      // Should return config without token
      expect(config).not.toHaveProperty("accessToken");
      expect(config.type).toBe("figspec");
      expect(config.url).toContain("figma.com");
    });

    it("should use token from process.env but not expose it in code", () => {
      const testToken = "figd_test_token_never_exposed";
      process.env.FIGMA_TOKEN = testToken;

      const config = getFigmaDesignConfig(
        "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/Test",
      );

      // Token should be in config (for Storybook), but not hardcoded
      expect(config.accessToken).toBe(testToken);

      // Verify the token is not hardcoded in the function
      const functionCode = getFigmaDesignConfig.toString();
      expect(functionCode).not.toContain("figd_");
      expect(functionCode).not.toContain(testToken);
    });
  });

  describe("No Hardcoded Tokens", () => {
    it("should not contain hardcoded tokens in source code", () => {
      const figmaStorybookPath = path.join(__dirname, "figma-storybook.ts");
      const figmaPath = path.join(__dirname, "figma.ts");
      const routePath = path.join(__dirname, "../../app/api/figma/route.ts");

      const files = [figmaStorybookPath, figmaPath, routePath];

      files.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf-8");
          // Should not contain any hardcoded figd_ tokens (except in comments/examples)
          const hardcodedTokenMatches = content.match(
            /figd_[a-zA-Z0-9_-]{20,}/g,
          );
          if (hardcodedTokenMatches) {
            // Only allow in comments or example strings
            hardcodedTokenMatches.forEach((match: string) => {
              const index = content.indexOf(match);
              const beforeMatch = content.substring(
                Math.max(0, index - 50),
                index,
              );
              // Allow in comments (// or /*) or example strings
              const isInComment =
                beforeMatch.includes("//") ||
                beforeMatch.includes("/*") ||
                beforeMatch.includes("example") ||
                beforeMatch.includes("Example");
              expect(isInComment).toBe(true);
            });
          }
        }
      });
    });
  });

  describe("Client Utility Security", () => {
    it("should not expose token in fetchFigmaFile", () => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: "Test", document: {} }),
      });

      // The function should call the proxy, not Figma directly
      fetchFigmaFile({ fileId: "DEKMQifA8YOb3oxznHboSY" });

      // Verify it calls our proxy endpoint, not Figma API directly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/figma"),
        expect.not.objectContaining({
          headers: expect.objectContaining({
            "X-Figma-Token": expect.anything(),
          }),
        }),
      );
    });
  });
});
