#!/usr/bin/env node

/**
 * Test script to verify token is NOT exposed in production Storybook build
 *
 * Run after: pnpm dashboard build-storybook
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

const storybookStaticDir = path.join(__dirname, "..", "storybook-static");

console.log("🔒 Checking production Storybook build for token exposure...\n");

if (!fs.existsSync(storybookStaticDir)) {
  console.log(
    "❌ Storybook build not found. Run 'pnpm dashboard build-storybook' first.",
  );
  process.exit(1);
}

let foundToken = false;
let checkedFiles = 0;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  checkedFiles++;

  // Check for any figd_ tokens (Figma tokens start with figd_)
  const tokenMatches = content.match(/figd_[a-zA-Z0-9_-]{30,}/g);
  if (tokenMatches) {
    tokenMatches.forEach((match) => {
      // Check if it's in a comment or example (safe)
      const index = content.indexOf(match);
      const context = content.substring(Math.max(0, index - 100), index + 100);
      const isSafe =
        context.includes("example") ||
        context.includes("Example") ||
        context.includes("your_token") ||
        context.includes("//") ||
        context.includes("/*");

      if (!isSafe) {
        console.log(
          `❌ Found potential token exposure in: ${path.relative(storybookStaticDir, filePath)}`,
        );
        console.log(`   Token: ${match.substring(0, 20)}...`);
        foundToken = true;
      }
    });
  }

  // Check for process.env.FIGMA_TOKEN being set to a value (not undefined)
  if (
    content.includes("process.env.FIGMA_TOKEN") &&
    !content.includes("undefined")
  ) {
    // Check if it's actually set to a token value
    const envMatches = content.match(
      /process\.env\.FIGMA_TOKEN["\s]*[:=]["\s]*["']?figd_/g,
    );
    if (envMatches) {
      console.log(
        `❌ Found FIGMA_TOKEN assignment in: ${path.relative(storybookStaticDir, filePath)}`,
      );
      foundToken = true;
    }
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith(".js") || file.endsWith(".html")) {
      checkFile(filePath);
    }
  });
}

walkDir(storybookStaticDir);

console.log(`\nChecked ${checkedFiles} files in production build`);

if (foundToken) {
  console.log("\n❌ SECURITY ISSUE: Token found in production build!");
  console.log("   The token should NEVER be in production Storybook builds.");
  process.exit(1);
} else {
  console.log(
    "\n✅ Security check passed: No tokens found in production build",
  );
  process.exit(0);
}
