import { useQuery } from "@tanstack/react-query";

import type {
  ProgramDefinition,
  ServiceProvider,
} from "@/features/service-providers/types";
import {
  fetchServiceProvidersData,
  type ServiceProvidersResult,
} from "@/features/service-providers/utils/fetchServiceProvidersData";

const buildProviders = (
  result: ServiceProvidersResult,
  programKey: string,
): ServiceProvider[] => {
  const { config, data, avatarUrls } = result;

  return config.providers
    .filter((entry) => entry.programs[programKey])
    .map((entry) => {
      const programEntry = entry.programs[programKey];
      return {
        name: entry.name,
        avatarUrl: avatarUrls[entry.slug],
        websiteUrl: entry.website,
        proposalUrl: programEntry.proposalUrl,
        budget: programEntry.budget,
        githubSlug: entry.slug,
        streamDuration: programEntry.streamDuration ?? 1,
        years: Object.fromEntries(
          Object.entries(data)
            .filter(([, slugData]) => slugData[entry.slug])
            .map(([year, slugData]) => [year, slugData[entry.slug]]),
        ),
      };
    });
};

type ServiceProvidersDataResult = {
  providers: ServiceProvider[];
  programKeys: string[];
  programs: Record<string, ProgramDefinition>;
  getProvidersForProgram: (programKey: string) => ServiceProvider[];
  isLoading: boolean;
};

export const useServiceProvidersData = (): ServiceProvidersDataResult => {
  const query = useQuery<ServiceProvidersResult | null>({
    queryKey: ["serviceProviders"],
    queryFn: fetchServiceProvidersData,
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });

  const result = query.data;

  return {
    providers: result
      ? Object.keys(result.programs).flatMap((key) =>
          buildProviders(result, key),
        )
      : [],
    programKeys: result ? Object.keys(result.programs) : [],
    programs: result?.programs ?? {},
    getProvidersForProgram: (programKey: string) =>
      result ? buildProviders(result, programKey) : [],
    isLoading: query.isLoading,
  };
};
