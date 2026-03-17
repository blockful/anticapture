import { useQuery } from "@tanstack/react-query";

import { ENS_SERVICE_PROVIDERS } from "@/features/service-providers/constants/ens-service-providers";
import type { ServiceProvider } from "@/features/service-providers/types";
import {
  fetchServiceProvidersData,
  type ServiceProvidersData,
} from "@/features/service-providers/utils/fetchServiceProvidersData";

const buildProviders = (data: ServiceProvidersData): ServiceProvider[] =>
  ENS_SERVICE_PROVIDERS.map((provider) => ({
    ...provider,
    years: Object.fromEntries(
      Object.entries(data)
        .filter(([, slugData]) => slugData[provider.githubSlug])
        .map(([year, slugData]) => [year, slugData[provider.githubSlug]]),
    ),
  }));

export const useServiceProvidersData = () => {
  const slugs = ENS_SERVICE_PROVIDERS.map((p) => p.githubSlug);

  return useQuery<ServiceProvider[]>({
    queryKey: ["serviceProviders", ...slugs],
    queryFn: async () => {
      const data = await fetchServiceProvidersData(slugs);
      return buildProviders(data);
    },
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
};
