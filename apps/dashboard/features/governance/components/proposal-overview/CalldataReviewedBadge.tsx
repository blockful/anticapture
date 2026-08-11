"use client";

import { ShieldCheck } from "lucide-react";

import {
  findCalldataReview,
  useCalldataReviews,
} from "@/features/governance/hooks/useCalldataReview";
import { BadgeStatus } from "@/shared/components/design-system/badges";
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

  const badge = (
    <BadgeStatus variant="success" iconVariant="success" icon={ShieldCheck}>
      Calldata reviewed
    </BadgeStatus>
  );

  if (!asLink) return badge;

  return (
    <a
      href={review.url}
      target="_blank"
      rel="noreferrer"
      className="transition-opacity hover:opacity-80"
    >
      {badge}
    </a>
  );
};
