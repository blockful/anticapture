import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  name: string;
  published_at: string;
}

const GITHUB_API_URL =
  "https://api.github.com/repos/blockful/anticapture/releases/latest";

export const fetchLatestRelease = async (): Promise<GitHubRelease> => {
  const response = await axios.get(GITHUB_API_URL);
  return response.data;
};

export const useGitHubRelease = () => {
  return useQuery<GitHubRelease, Error>({
    queryKey: ["github-latest-release"],
    queryFn: fetchLatestRelease,
    staleTime: 3600000, // Cache for 1 hour
    gcTime: 3600000, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
