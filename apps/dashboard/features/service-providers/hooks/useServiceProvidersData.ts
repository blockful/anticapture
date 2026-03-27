import { useQuery } from "@tanstack/react-query";

import type {
  ProgramDefinition,
  ServiceProvider,
} from "@/features/service-providers/types";
import {
  fetchServiceProvidersData,
  type ServiceProvidersResult,
} from "@/features/service-providers/utils/fetchServiceProvidersData";

const isHttpUrl = (url: string | undefined): url is string =>
  !!url && /^https?:\/\//.test(url);

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
        streamDuration: programEntry.streamDuration ?? 1,
        years: Object.fromEntries(
          Object.entries(result.data)
            .filter(([, slugData]) => slugData[entry.slug])
            .map(([year, slugData]) => [year, slugData[entry.slug]]),
        ),
      };
    });

type ServiceProvidersDataResult = {
  providers: ServiceProvider[];
  programKeys: string[];
  programs: Record<string, ProgramDefinition>;
  getProvidersForProgram: (programKey: string) => ServiceProvider[];
  isLoading: boolean;
};

export const useServiceProvidersData = (): ServiceProvidersDataResult => {
  const query = useQuery<ServiceProvidersResult>({
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
