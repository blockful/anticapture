"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { DaoIdEnum } from "@/shared/types/daos";

const REPO_URL = "https://github.com/blockful/dao-proposals";
const CONTENTS_URL =
  "https://api.github.com/repos/blockful/dao-proposals/contents";

// DAO folders in the dao-proposals repo. DAOs missing here have no reviews.
const REPO_DAO_DIR: Partial<Record<DaoIdEnum, string>> = {
  [DaoIdEnum.ENS]: "ens",
  [DaoIdEnum.UNISWAP]: "uniswap",
  [DaoIdEnum.SHU]: "shutter",
  [DaoIdEnum.TORN]: "tornado",
};

export type CalldataReview = { name: string; url: string };

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Review folders are named either by proposal number ("93 - UNIfication", "67")
 * or by a slug that shows up in the proposal title ("ep-6-39" -> "[EP 6.39] ...").
 */
export const findCalldataReview = (
  reviews: CalldataReview[],
  proposal: { id: string; title: string },
): CalldataReview | undefined =>
  reviews.find((review) => {
    const leadingNumber = review.name.match(/^(\d+)\b/)?.[1];
    if (leadingNumber) return leadingNumber === proposal.id;
    return `-${slug(proposal.title)}-`.includes(`-${slug(review.name)}-`);
  });

export const useCalldataReviews = (daoId: DaoIdEnum) => {
  const dir = REPO_DAO_DIR[daoId];

  return useQuery<CalldataReview[]>({
    queryKey: ["calldata-reviews", dir],
    enabled: Boolean(dir),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const { data } = await axios.get<{ name: string; type: string }[]>(
        `${CONTENTS_URL}/src/${dir}/proposals`,
      );
      return data
        .filter((entry) => entry.type === "dir")
        .map((entry) => ({
          name: entry.name,
          url: `${REPO_URL}/tree/main/src/${dir}/proposals/${encodeURIComponent(entry.name)}`,
        }));
    },
  });
};
