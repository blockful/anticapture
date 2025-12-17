import { env } from "@/env";
import axios from "axios";
import { DefiLlamaProvider } from "./providers/defillama–provider";
import { DuneProvider } from "./providers/dune-provider";
import { TreasuryService } from "./treasury.service";
import { assets } from "@/api/controllers";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";

/**
 * Creates a treasury provider and registers API routes
 * Providers fetch data on-demand
 * @param app - The Hono app instance
 * @returns void - Returns early if no provider is configured
 */
export function createTreasuryProvider(app: Hono) {
  if (env.TREASURY_PROVIDER_PROTOCOL_ID && env.DEFILLAMA_API_URL) {
    const axiosClient = axios.create({
      baseURL: env.DEFILLAMA_API_URL,
    });
    const defiLlamaProvider = new DefiLlamaProvider(
      axiosClient,
      env.TREASURY_PROVIDER_PROTOCOL_ID,
    );
    const treasuryService = new TreasuryService(defiLlamaProvider);
    assets(app, treasuryService);
  } else if (env.DUNE_API_URL && env.DUNE_API_KEY) {
    const axiosClient = axios.create({
      baseURL: env.DUNE_API_URL,
    });
    const duneProvider = new DuneProvider(axiosClient, env.DUNE_API_KEY);
    const treasuryService = new TreasuryService(duneProvider);
    assets(app, treasuryService);
  } else {
    console.warn("Treasury provider not configured.");
    return;
  }
}
