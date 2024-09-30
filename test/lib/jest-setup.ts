import dotenv from "dotenv";
import { AnvilInstance } from "./anvil";
import { clearAllDataFromDatabase } from "./database/clearAllData";
import { pgClient } from "./database/pg.client";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { delay } from "../utils/delay";
dotenv.config();

let localNode: ChildProcessWithoutNullStreams;
let ponderProcess: ChildProcessWithoutNullStreams;
beforeAll(async () => {
  localNode = spawn("anvil");
  await delay(3000);
  const deployContracts = spawn("npm", ["run", "locally:deploy-ens"]);
  deployContracts.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  deployContracts.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  deployContracts.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
  await delay(3000);
  ponderProcess = spawn("npm", ["run", "dev"]);
  await delay(3000);
});

afterAll(async () => {
  await clearAllDataFromDatabase();
  await pgClient.end();
  localNode.kill();
  ponderProcess.kill();
});
