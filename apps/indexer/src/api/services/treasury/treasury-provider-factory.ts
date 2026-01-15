import axios from "axios";
import { DefiLlamaProvider } from "./providers/defillama–provider";
import { DuneProvider } from "./providers/dune-provider";
import { TreasuryService } from "./treasury.service";
import { TreasuryRepository } from "@/api/repositories/treasury";
import { PriceProvider } from "./types";
import { CompoundProvider, TreasuryProvider } from "./providers";

export type TreasuryProviderConfig =
  | {
      id: "DUNE";
      apiUrl: string;
      apiKey: string;
    }
  | {
      id: "DEFILLAMA";
      apiUrl: string;
    }
  | {
      id: "COMPOUND";
      apiUrl: string;
    };

function resolveTreasuryProvider(
  config: TreasuryProviderConfig,
): TreasuryProvider {
  switch (config.id) {
    case "DUNE":
      return new DuneProvider(
        axios.create({
          baseURL: config.apiUrl,
        }),
        config.apiKey,
      );
    case "DEFILLAMA":
      return new DefiLlamaProvider(
        axios.create({
          baseURL: config.apiUrl,
        }),
      );
    case "COMPOUND":
      return new CompoundProvider(
        axios.create({
          baseURL: config.apiUrl,
        }),
      );
  }
}

export function parseTreasuryProviderConfig(
  id?: "DUNE" | "DEFILLAMA" | "COMPOUND" | undefined,
  apiUrl?: string | undefined,
  apiKey?: string | undefined,
): TreasuryProviderConfig | undefined {
  if (!(id && apiUrl)) return undefined;

  switch (id) {
    case "DUNE": {
      if (!apiKey) return undefined;
      return {
        id,
        apiUrl,
        apiKey,
      };
    }
    case "DEFILLAMA":
      return {
        id,
        apiUrl,
      };
    case "COMPOUND":
      return {
        id,
        apiUrl,
      };
    default:
      return undefined;
  }
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
  config?: TreasuryProviderConfig,
): TreasuryService {
  const liquidProvider = config ? resolveTreasuryProvider(config) : undefined;
  if (!config) {
    console.warn(
      "Liquid treasury provider not configured. Only dao-token treasury will be available.",
    );
  }

  return new TreasuryService(repository, liquidProvider, tokenPriceProvider);
}
