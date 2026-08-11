"use client";

import { ShieldCheck } from "lucide-react";

import {
  findCalldataReview,
  useCalldataReviews,
} from "@/features/governance/hooks/useCalldataReview";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import type { DaoIdEnum } from "@/shared/types/daos";

/**
 * Marks proposals whose calldata was verified in blockful/dao-proposals.
 * `asLink` is off inside the proposal list because the row is already a link.
 */
export const CalldataReviewedBadge = ({
  daoId,
  proposalId,
  title,
  asLink = false,
}: {
  daoId: DaoIdEnum;
  proposalId: string;
  title: string;
  asLink?: boolean;
}) => {
  const { data: reviews } = useCalldataReviews(daoId);
  const review = findCalldataReview(reviews ?? [], { id: proposalId, title });

  if (!review) return null;

  const icon = (
    <ShieldCheck
      className="text-success size-4"
      aria-label="Calldata reviewed"
    />
  );

  return (
    <Tooltip
      asChild
      tooltipContent={
        asLink
          ? "Calldata reviewed — open the check on GitHub"
          : "Calldata reviewed"
      }
    >
      {asLink ? (
        <a
          href={review.url}
          target="_blank"
          rel="noreferrer"
          className="flex transition-opacity hover:opacity-80"
        >
          {icon}
        </a>
      ) : (
        <span className="flex">{icon}</span>
      )}
    </Tooltip>
  );
};
