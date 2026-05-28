import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  name: string;
  published_at: string;
}

interface DashboardRelease extends GitHubRelease {
  version: string;
}

const GITHUB_API_URL =
  "https://api.github.com/repos/blockful/anticapture/releases";
const DASHBOARD_TAG_PREFIX = "dashboard@";

export const fetchLatestDashboardRelease =
  async (): Promise<DashboardRelease | null> => {
    const response = await axios.get<GitHubRelease[]>(GITHUB_API_URL, {
      params: { per_page: 100 },
    });
    const dashboardRelease = response.data.find((release) =>
      release.tag_name.startsWith(DASHBOARD_TAG_PREFIX),
    );
    if (!dashboardRelease) return null;
    return {
      ...dashboardRelease,
      version: `v${dashboardRelease.tag_name.slice(DASHBOARD_TAG_PREFIX.length)}`,
    };
  };

export const useGitHubRelease = () => {
  return useQuery<DashboardRelease | null, Error>({
    queryKey: ["github-latest-dashboard-release"],
    queryFn: fetchLatestDashboardRelease,
    staleTime: 3600000, // Cache for 1 hour
    gcTime: 3600000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
