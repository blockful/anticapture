import { useQuery } from "@tanstack/react-query";

import type {
  ProgramDefinition,
  ServiceProvider,
} from "@/features/service-providers/types";
import {
  fetchServiceProvidersData,
  type ServiceProvidersResult,
} from "@/features/service-providers/utils/fetchServiceProvidersData";
import { isHttpUrl } from "@/features/service-providers/utils/isHttpUrl";

const ONE_HOUR_MS = 60 * 60 * 1000;

const buildProviders = (
  result: ServiceProvidersResult,
  programKey: string,
): ServiceProvider[] =>
  result.config.providers
    .filter((entry) => entry.programs[programKey])
    .map((entry) => {
      const programEntry = entry.programs[programKey];
      return {
        name: entry.name,
        avatarUrl: result.avatarUrls[entry.slug],
        websiteUrl: isHttpUrl(entry.website) ? entry.website : undefined,
        proposalUrl: isHttpUrl(programEntry.proposalUrl)
          ? programEntry.proposalUrl
          : undefined,
        budget: programEntry.budget,
        githubSlug: entry.slug,
        streamDuration: programEntry.streamDuration,
        years: Object.fromEntries(
          Object.entries(result.data)
            .filter(([, slugData]) => slugData[entry.slug])
            .map(([year, slugData]) => [year, slugData[entry.slug]]),
        ),
      };
    });

type ServiceProvidersDataResult = {
  programKeys: string[];
  programs: Record<string, ProgramDefinition>;
  getProvidersForProgram: (programKey: string) => ServiceProvider[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

export const useServiceProvidersData = (): ServiceProvidersDataResult => {
  const query = useQuery<ServiceProvidersResult>({
    queryKey: ["serviceProviders"],
    queryFn: fetchServiceProvidersData,
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_HOUR_MS,
    refetchOnWindowFocus: false,
  });

  const result = query.data;

  return {
    programKeys: result ? Object.keys(result.programs) : [],
    programs: result?.programs ?? {},
    getProvidersForProgram: (programKey: string) =>
      result ? buildProviders(result, programKey) : [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
