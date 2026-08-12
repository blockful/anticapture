"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { DaoIdEnum } from "@/shared/types/daos";

const REPO_URL = "https://github.com/blockful/dao-proposals";
const TREE_URL =
  "https://api.github.com/repos/blockful/dao-proposals/git/trees/main?recursive=1";

// DAO folders in the dao-proposals repo. DAOs missing here have no reviews.
const REPO_DAO_DIR: Partial<Record<DaoIdEnum, string>> = {
  [DaoIdEnum.ENS]: "ens",
  [DaoIdEnum.UNISWAP]: "uniswap",
  [DaoIdEnum.SHU]: "shutter",
  [DaoIdEnum.TORN]: "tornado",
};

export type CalldataReview = { name: string; url: string };

/**
 * Only unambiguous identifiers count — this badge is a trust signal, so a folder
 * whose name merely resembles the title must not claim a review:
 * - "93 - UNIfication", "67" -> proposal id
 * - "ep-6-39" -> the "[EP 6.39]" tag ENS proposals carry in their title
 * Free-form folder names (Shutter's "dsr-allocation") stay unmatched by design.
 */
export const findCalldataReview = (
  reviews: CalldataReview[],
  proposal: { id: string; title: string },
): CalldataReview | undefined => {
  const ep = proposal.title.match(/\bEP\s*(\d+)\.(\d+)\b/i);
  const epFolder = ep && `ep-${ep[1]}-${ep[2]}`;

  return reviews.find((review) => {
    const leadingNumber = review.name.match(/^(\d+)\b/)?.[1];
    if (leadingNumber) return leadingNumber === proposal.id;
    return review.name.toLowerCase() === epFolder;
  });
};

export const useCalldataReviews = (daoId: DaoIdEnum) => {
  const dir = REPO_DAO_DIR[daoId];

  // One tree fetch for the whole repo, cached DAO-independently and filtered per DAO.
  return useQuery<string[], Error, CalldataReview[]>({
    queryKey: ["calldata-reviews"],
    enabled: Boolean(dir),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const { data } = await axios.get<{
        tree: { path: string; type: string }[];
      }>(TREE_URL);

      return data.tree
        .filter((entry) => entry.type === "blob")
        .map((entry) => entry.path);
    },
    select: (paths) => {
      // The check itself is the proof, so link the test file, not the folder.
      // One entry per folder; ep-6-23 names it activeProposal.t.sol instead.
      const checkFile = new RegExp(
        `^src/${dir}/proposals/([^/]+)/[^/]+\\.t\\.sol$`,
      );
      const reviews = new Map<string, CalldataReview>();

      for (const path of paths) {
        const name = path.match(checkFile)?.[1];
        if (!name || reviews.has(name)) continue;
        reviews.set(name, {
          name,
          url: `${REPO_URL}/blob/main/${path.split("/").map(encodeURIComponent).join("/")}`,
        });
      }

      return [...reviews.values()];
    },
  });
};
