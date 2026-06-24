#!/usr/bin/env node
// Points Claude Code's auto-memory at the repo-tracked shared folder.
//
// `autoMemoryDirectory` must be an ABSOLUTE path (Claude Code rejects repo-relative
// paths), so it can't live in the committed settings.json — each clone differs. This
// resolves the absolute path for THIS machine and writes it into the gitignored
// .claude/settings.local.json. Run once per dev: `pnpm setup:memory`.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const memoryDir = join(repoRoot, ".agents", "shared-memory");
const settingsPath = join(repoRoot, ".claude", "settings.local.json");

let settings = {};
if (existsSync(settingsPath)) {
  const raw = readFileSync(settingsPath, "utf8").trim();
  if (raw) {
    try {
      settings = JSON.parse(raw);
    } catch {
      console.error(
        `\n  ✗ Could not parse ${settingsPath}.\n` +
          `    Add this key by hand instead:\n      "autoMemoryDirectory": "${memoryDir}"\n`,
      );
      process.exit(1);
    }
  }
} else {
  mkdirSync(dirname(settingsPath), { recursive: true });
}

if (settings.autoMemoryDirectory === memoryDir) {
  console.log(`\n  ✓ autoMemoryDirectory already set to ${memoryDir}\n`);
  process.exit(0);
}

settings.autoMemoryDirectory = memoryDir;
writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");

console.log(
  `\n  ✓ Set autoMemoryDirectory -> ${memoryDir}\n` +
    `    in ${settingsPath}\n\n` +
    `  Restart your Claude Code session for it to take effect.\n` +
    `  Inspect with the /memory command.\n`,
);
