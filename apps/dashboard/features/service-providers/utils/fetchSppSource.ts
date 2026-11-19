import {
  GITHUB_API_BASE,
  GITHUB_RAW_BASE,
} from "@/features/service-providers/constants/github";
import type {
  ProgramsConfig,
  ProvidersConfig,
} from "@/features/service-providers/types";

/**
 * The files the Service Providers page is built from, as published in the
 * ensdao/spp repository. Read on the server (see `/api/service-providers`) so
 * the page does not depend on the visitor's network reaching
 * raw.githubusercontent.com: that host is blocked in some countries and
 * refuses many VPN and shared exit addresses.
 */
export type SppSource = {
  config: ProvidersConfig;
  programsConfig: ProgramsConfig;
  avatarUrls: Record<string, string>;
};

/** Same signature as `fetch`, so the route can add Next's cache options. */
export type SppFetch = (url: string) => Promise<Response>;

const fetchJson = async <T>(path: string, fetchImpl: SppFetch): Promise<T> => {
  const response = await fetchImpl(`${GITHUB_RAW_BASE}/${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return (await response.json()) as T;
};

// Avatars are optional: any failure here leaves providers with initials.
const fetchAvatarUrls = async (
  fetchImpl: SppFetch,
): Promise<Record<string, string>> => {
  try {
    const response = await fetchImpl(
      `${GITHUB_API_BASE}/git/trees/main?recursive=1`,
    );
    if (!response.ok) return {};

    const { tree }: { tree: { path: string; type: string }[] } =
      await response.json();

    return Object.fromEntries(
      tree
        .filter(
          (item) =>
            item.type === "blob" && /^avatars\/[^/]+\.[^.]+$/.test(item.path),
        )
        .map((item) => {
          const fileName = item.path.slice("avatars/".length);
          const slug = fileName.slice(0, fileName.lastIndexOf("."));
          return [slug, `${GITHUB_RAW_BASE}/${item.path}`];
        }),
    );
  } catch {
    return {};
  }
};

export const fetchSppSource = async (
  fetchImpl: SppFetch = (url) => fetch(url),
): Promise<SppSource> => {
  const [config, programsConfig, avatarUrls] = await Promise.all([
    fetchJson<ProvidersConfig>("providers.json", fetchImpl),
    fetchJson<ProgramsConfig>("programs.json", fetchImpl),
    fetchAvatarUrls(fetchImpl),
  ]);

  return { config, programsConfig, avatarUrls };
};
