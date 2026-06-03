import type { Address } from "viem";

import { cn } from "@/shared/utils/cn";
import { formatPlural } from "@/shared/utils/formatPlural";

const EFP_APP_ORIGIN = "https://efp.app";

/** EFP app icon gradient start — used for follow affordances in the UI */
export const EFP_ACCENT_COLOR = "#FFE067";

export type EfpStats = {
  followersCount: number;
  followingCount: number;
} | null;

/** Profile slug for efp.app — prefers ENS name when available. */
export const getEfpProfileSlug = (
  address: Address,
  ensName?: string | null,
): string => (ensName?.trim() ? ensName.trim() : address);

export const getEfpProfileUrl = (
  address: Address,
  ensName?: string | null,
): string => `${EFP_APP_ORIGIN}/${getEfpProfileSlug(address, ensName)}`;

export const formatEfpFollowersCount = (count: number): string =>
  formatPlural(count, "follower");

/** "following" is invariant (not followings). */
export const formatEfpFollowingCount = (count: number): string =>
  `${count} following`;

/** Single-line label for the drawer EFP pill. */
export const formatEfpDrawerStatsLabel = (
  stats: NonNullable<EfpStats>,
): string => {
  const followers =
    stats.followersCount === 1
      ? "1 Follower"
      : `${stats.followersCount} Followers`;

  return `${followers} · ${stats.followingCount} Following`;
};

export const formatEfpCounts = (stats: EfpStats): string | null => {
  if (!stats) {
    return null;
  }

  return `${formatEfpFollowersCount(stats.followersCount)} · ${formatEfpFollowingCount(stats.followingCount)}`;
};

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

/** Name underline when the connected wallet follows this address on EFP */
export const getEfpFollowNameClassName = (
  viewerFollows: boolean,
  isDashed = false,
): string | undefined => {
  if (!viewerFollows) {
    return isDashed ? "border-b border-dashed border-[#3F3F46]" : undefined;
  }

  return cn(
    isDashed
      ? "border-b border-dashed border-[#FFE067]"
      : "underline decoration-[#FFE067] decoration-2 underline-offset-2",
  );
};
