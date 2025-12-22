#!/usr/bin/env node

/**
 * Security check script to verify Figma token is not exposed
 *
 * Run with: node scripts/check-token-security.js
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
// Pattern for detecting Figma Personal Access Tokens (never hardcode actual tokens!)
const FIGMA_TOKEN_PATTERN = /figd_[a-zA-Z0-9_-]{30,}/g;

let errors = [];
let warnings = [];

console.log("🔒 Checking Figma token security...\n");

// Check 1: No hardcoded tokens in source files
console.log("1. Checking for hardcoded tokens in source files...");
const sourceFiles = [
  "shared/utils/figma-storybook.ts",
  "shared/utils/figma.ts",
  "app/api/figma/route.ts",
];

sourceFiles.forEach((file) => {
  const filePath = path.join(ROOT_DIR, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    // Check for any figd_ tokens that might be hardcoded
    const tokenMatches = content.match(FIGMA_TOKEN_PATTERN);
    if (tokenMatches) {
      tokenMatches.forEach((match) => {
        const index = content.indexOf(match);
        const context = content.substring(
          Math.max(0, index - 100),
          index + 100,
        );
        // Allow in comments or example strings
        if (
          !context.includes("//") &&
          !context.includes("/*") &&
          !context.includes("example") &&
          !context.includes("Example") &&
          !context.includes("your_token")
        ) {
          errors.push(
            `❌ Possible hardcoded token found in ${file}: ${match.substring(0, 20)}...`,
          );
        }
      });
    }
  }
});

// Check 2: .env.local is gitignored
console.log("2. Checking .gitignore...");
const gitignorePath = path.join(ROOT_DIR, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, "utf-8");
  if (!gitignore.includes(".env.local")) {
    warnings.push("⚠️  .env.local is not in .gitignore");
  } else {
    console.log("   ✅ .env.local is in .gitignore");
  }
} else {
  warnings.push("⚠️  .gitignore file not found");
}

// Check 3: No NEXT_PUBLIC_ prefix (would expose to browser)
console.log("3. Checking for NEXT_PUBLIC_ prefix usage...");
const allFiles = getAllTsFiles(ROOT_DIR);
allFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  if (
    content.includes("NEXT_PUBLIC_FIGMA_TOKEN") ||
    content.includes("process.env.NEXT_PUBLIC_FIGMA_TOKEN")
  ) {
    errors.push(
      `❌ Found NEXT_PUBLIC_FIGMA_TOKEN in ${path.relative(ROOT_DIR, file)} - this would expose token to browser!`,
    );
  }
});

// Check 4: Storybook files don't have hardcoded tokens
console.log("4. Checking Storybook files...");
const storyFiles = getAllStoryFiles(ROOT_DIR);
let storyFilesWithTokens = 0;
storyFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  // Check for any figd_ tokens that might be hardcoded
  const tokenMatches = content.match(FIGMA_TOKEN_PATTERN);
  if (tokenMatches) {
    errors.push(`❌ Found hardcoded token in ${path.relative(ROOT_DIR, file)}`);
    storyFilesWithTokens++;
  }
  if (content.includes('accessToken: "figd_')) {
    errors.push(
      `❌ Found hardcoded accessToken in ${path.relative(ROOT_DIR, file)}`,
    );
    storyFilesWithTokens++;
  }
});
if (storyFilesWithTokens === 0) {
  console.log(`   ✅ All ${storyFiles.length} story files are clean`);
}

// Check 5: API route uses process.env (server-side)
console.log("5. Checking API route implementation...");
const routePath = path.join(ROOT_DIR, "app/api/figma/route.ts");
if (fs.existsSync(routePath)) {
  const content = fs.readFileSync(routePath, "utf-8");
  if (content.includes("process.env.FIGMA_TOKEN")) {
    console.log("   ✅ API route uses process.env.FIGMA_TOKEN (server-side)");
  } else {
    errors.push("❌ API route does not use process.env.FIGMA_TOKEN");
  }
  if (content.includes("X-Figma-Token")) {
    console.log("   ✅ API route properly uses X-Figma-Token header");
  }
}

// Summary
console.log("\n" + "=".repeat(50));
if (errors.length === 0 && warnings.length === 0) {
  console.log("✅ All security checks passed!");
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log("\n❌ ERRORS FOUND:");
    errors.forEach((error) => console.log(`   ${error}`));
  }
  if (warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    warnings.forEach((warning) => console.log(`   ${warning}`));
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

function getAllTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        results = results.concat(getAllTsFiles(filePath));
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(filePath);
    }
  });
  return results;
}

function getAllStoryFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        results = results.concat(getAllStoryFiles(filePath));
      }
    } else if (file.endsWith(".stories.tsx") || file.endsWith(".stories.ts")) {
      results.push(filePath);
    }
  });
  return results;
}
