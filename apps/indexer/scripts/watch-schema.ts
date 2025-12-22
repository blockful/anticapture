import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const PONDER_SCHEMA_PATH = path.join(__dirname, "../ponder.schema.ts");

console.log("👀 Watching ponder.schema.ts for changes...");

fs.watch(PONDER_SCHEMA_PATH, (eventType) => {
  if (eventType === "change") {
    console.log("📝 ponder.schema.ts changed, regenerating API schema...");
    execSync("npm run schema", { stdio: "inherit" });
    console.log("✅ API schema updated");
  }
});
