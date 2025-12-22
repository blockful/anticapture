import { env } from "@/env";
import axios from "axios";
import { DefiLlamaProvider } from "./providers/defillama–provider";
import { DuneProvider } from "./providers/dune-provider";
import { CoingeckoPriceProvider } from "./providers/coingecko-price-provider";
import { TreasuryService } from "./treasury.service";
import { CoingeckoService } from "@/api/services/coingecko";
import { PriceProvider } from "./types";

/**
 * Creates the price provider for token prices (CoinGecko)
 */
export function createTokenPriceProvider(): PriceProvider | undefined {
  if (env.COINGECKO_API_URL && env.COINGECKO_API_KEY) {
    const coingeckoService = new CoingeckoService(
      env.COINGECKO_API_URL,
      env.COINGECKO_API_KEY,
      env.DAO_ID,
    );
    return new CoingeckoPriceProvider(coingeckoService);
  }
  return undefined;
}

/**
 * Creates a treasury service with optional liquid treasury provider.
 * The service is created if at least the tokenPriceProvider is available,
 * allowing dao-token and total treasury endpoints to work even without
 * a liquid treasury provider (DefiLlama/Dune).
 *
 * @returns TreasuryService instance
 */
export function createTreasuryService(
  tokenPriceProvider: PriceProvider,
): TreasuryService {
  let liquidProvider: DefiLlamaProvider | DuneProvider | undefined;
  if (env.TREASURY_PROVIDER_PROTOCOL_ID && env.DEFILLAMA_API_URL) {
    const axiosClient = axios.create({
      baseURL: env.DEFILLAMA_API_URL,
    });
    liquidProvider = new DefiLlamaProvider(
      axiosClient,
      env.TREASURY_PROVIDER_PROTOCOL_ID,
    );
  } else if (env.DUNE_API_URL && env.DUNE_API_KEY) {
    const axiosClient = axios.create({
      baseURL: env.DUNE_API_URL,
    });
    liquidProvider = new DuneProvider(axiosClient, env.DUNE_API_KEY);
  } else {
    console.warn(
      "Liquid treasury provider not configured. Only dao-token treasury will be available.",
    );
  }

  return new TreasuryService(liquidProvider, tokenPriceProvider);
}
