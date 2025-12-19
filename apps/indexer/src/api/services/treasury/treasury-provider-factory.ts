import { env } from "@/env";
import axios from "axios";
import { DefiLlamaProvider } from "./providers/defillama–provider";
import { DuneProvider } from "./providers/dune-provider";
import { TreasuryService } from "./treasury.service";

/**
 * Creates a treasury provider
 * Providers fetch data on-demand
 * @returns TreasuryService instance or null if no provider is configured
 */
export function createTreasuryProvider(): TreasuryService | null {
  if (env.TREASURY_PROVIDER_PROTOCOL_ID && env.DEFILLAMA_API_URL) {
    const axiosClient = axios.create({
      baseURL: env.DEFILLAMA_API_URL,
    });
    const defiLlamaProvider = new DefiLlamaProvider(
      axiosClient,
      env.TREASURY_PROVIDER_PROTOCOL_ID,
    );
    return new TreasuryService(defiLlamaProvider);
  } else if (env.DUNE_API_URL && env.DUNE_API_KEY) {
    const axiosClient = axios.create({
      baseURL: env.DUNE_API_URL,
    });
    const duneProvider = new DuneProvider(axiosClient, env.DUNE_API_KEY);
    return new TreasuryService(duneProvider);
  } else {
    console.warn("Treasury provider not configured.");
    return null;
  }
}
