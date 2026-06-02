import { formatPlural } from "@/shared/utils/formatPlural";

export type EfpStats = {
  followersCount: number;
  followingCount: number;
} | null;

export const formatEfpCounts = (stats: EfpStats): string | null => {
  if (!stats) {
    return null;
  }

  return `${formatPlural(stats.followersCount, "follower")} · ${stats.followingCount} following`;
};

export const formatEfpIdentityLabel = (): string =>
  "EFP social graph — identity context, not a risk signal.";

export const shouldShowYouFollow = (
  state:
    | {
        follow: boolean;
        block: boolean;
        mute: boolean;
      }
    | null
    | undefined,
): boolean => !!state?.follow && !state.block && !state.mute;
