import axios from "axios";
import { DefiLlamaProvider } from "./providers/defillama–provider";
import { DuneProvider } from "./providers/dune-provider";
import { CoingeckoPriceProvider } from "./providers/coingecko-price-provider";
import { TreasuryService } from "./treasury.service";
import { TreasuryRepository } from "@/api/repositories/treasury";
import { CoingeckoService } from "@/api/services/coingecko";
import { PriceProvider } from "./types";
import { DaoIdEnum } from "@/lib/enums";

/**
 * Creates the price provider for token prices (CoinGecko)
 */
export function createTokenPriceProvider(
  apiUrl: string,
  apiKey: string,
  daoId: DaoIdEnum,
): PriceProvider {
  const coingeckoService = new CoingeckoService(apiUrl, apiKey, daoId);
  return new CoingeckoPriceProvider(coingeckoService);
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
  repository: TreasuryRepository,
  tokenPriceProvider: PriceProvider,
  defiLlamaApiUrl?: string,
  defiLlamaProtocolId?: string,
  duneApiUrl?: string,
  duneApiKey?: string,
): TreasuryService {
  let liquidProvider: DefiLlamaProvider | DuneProvider | undefined;
  if (defiLlamaProtocolId && defiLlamaApiUrl) {
    const axiosClient = axios.create({
      baseURL: defiLlamaApiUrl,
    });
    liquidProvider = new DefiLlamaProvider(axiosClient, defiLlamaProtocolId);
  } else if (duneApiUrl && duneApiKey) {
    const axiosClient = axios.create({
      baseURL: duneApiUrl,
    });
    liquidProvider = new DuneProvider(axiosClient, duneApiKey);
  } else {
    console.warn(
      "Liquid treasury provider not configured. Only dao-token treasury will be available.",
    );
  }

  return new TreasuryService(repository, liquidProvider, tokenPriceProvider);
}
