#!/usr/bin/env node

/**
 * Validates FIGMA_TOKEN environment variable at build time
 *
 * Run with: node scripts/validate-figma-token.js
 *
 * This script will fail the build if:
 * - FIGMA_TOKEN is not set
 * - FIGMA_TOKEN doesn't match the expected format (figd_...)
 * - FIGMA_TOKEN is invalid (optional API validation)
 */

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

// Figma Personal Access Tokens start with 'figd_'
const FIGMA_TOKEN_PATTERN = /^figd_[a-zA-Z0-9_-]{20,}$/;

async function validateToken() {
  console.log("🔑 Validating FIGMA_TOKEN environment variable...\n");

  // Check 1: Token is set
  if (!FIGMA_TOKEN) {
    console.error("❌ ERROR: FIGMA_TOKEN environment variable is not set");
    console.error("   Please set it in your Vercel environment variables.");
    console.error(
      "   Get your token from: https://www.figma.com/developers/api#access-tokens",
    );
    process.exit(1);
  }

  console.log("✅ FIGMA_TOKEN is set");

  // Check 2: Token format is valid
  if (!FIGMA_TOKEN_PATTERN.test(FIGMA_TOKEN)) {
    console.error("❌ ERROR: FIGMA_TOKEN format is invalid");
    console.error("   Expected format: figd_<alphanumeric_string>");
    console.error(
      "   Token should start with 'figd_' followed by at least 20 characters.",
    );
    console.error("");
    console.error("   Common issues:");
    console.error(
      "   - Token might be a personal access token from old format",
    );
    console.error("   - Token might be truncated or have extra whitespace");
    console.error("   - Token might be an OAuth token (not supported)");
    process.exit(1);
  }

  console.log("✅ FIGMA_TOKEN format is valid");

  // Check 3: Token works with Figma API (optional - can be slow)
  // Only run if VALIDATE_FIGMA_TOKEN_API=true
  if (process.env.VALIDATE_FIGMA_TOKEN_API === "true") {
    console.log("\n🔄 Validating token with Figma API...");

    try {
      const response = await fetch("https://api.figma.com/v1/me", {
        headers: {
          "X-Figma-Token": FIGMA_TOKEN,
        },
      });

      if (response.ok) {
        const user = await response.json();
        console.log(
          `✅ Token is valid - authenticated as: ${user.email || user.handle || "unknown"}`,
        );
      } else if (response.status === 403) {
        console.error("❌ ERROR: FIGMA_TOKEN is invalid or expired");
        console.error(
          "   Please generate a new token at: https://www.figma.com/developers/api#access-tokens",
        );
        process.exit(1);
      } else {
        console.warn(
          `⚠️  WARNING: Could not verify token with Figma API (status: ${response.status})`,
        );
        console.warn(
          "   Build will continue, but token might not work at runtime.",
        );
      }
    } catch (error) {
      console.warn(
        "⚠️  WARNING: Could not connect to Figma API to verify token",
      );
      console.warn(`   Error: ${error.message}`);
      console.warn(
        "   Build will continue, but verify your network connection.",
      );
    }
  }

  console.log("\n✅ FIGMA_TOKEN validation passed!\n");
}

validateToken().catch((error) => {
  console.error("❌ Unexpected error during validation:", error);
  process.exit(1);
});
