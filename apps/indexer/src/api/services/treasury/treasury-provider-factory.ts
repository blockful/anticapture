import { env } from "@/env";
import axios from "axios";
import { DefiLlamaProvider } from "./providers/defillama–provider";
import { TreasuryService } from "./treasury.service";
import { writableDb } from "@/lib/db";
import { assets } from "@/api/controller";
import { startTreasurySyncCron } from "@/api/treasury-sync.cron";
import { DuneProvider } from "./providers/dune-provider";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";

export function createTreasuryProvider(app: Hono) {
  if (env.TREASURY_PROVIDER_PROTOCOL_ID && env.DEFILLAMA_API_URL) {
    const axiosClient = axios.create({
      baseURL: env.DEFILLAMA_API_URL,
    });
    const defiLlamaProvider = new DefiLlamaProvider(
      axiosClient,
      env.TREASURY_PROVIDER_PROTOCOL_ID,
    );
    const treasuryService = new TreasuryService(writableDb, defiLlamaProvider);
    assets(app, treasuryService);

    // fill the historical treasury table each day
    startTreasurySyncCron(treasuryService);
  } else if (env.DUNE_API_URL && env.DUNE_API_KEY) {
    const axiosClient = axios.create({
      baseURL: env.DUNE_API_URL,
    });
    const duneProvider = new DuneProvider(axiosClient, env.DUNE_API_KEY);
    const treasuryService = new TreasuryService(writableDb, duneProvider);
    assets(app, treasuryService);

    // fill the historical treasury table each day
    startTreasurySyncCron(treasuryService);
  } else {
    throw new Error("Not enough variables to create a treasury provider");
  }
}
