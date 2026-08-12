"use client";

import { BadgeCheck } from "lucide-react";

import {
  findCalldataReview,
  useCalldataReviews,
} from "@/features/governance/hooks/useCalldataReview";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { BulletDivider } from "@/shared/components/design-system/section";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import type { DaoIdEnum } from "@/shared/types/daos";

/**
 * Marks proposals whose calldata was verified in blockful/dao-proposals.
 * `withLabel` renders the labelled link used on the proposal page; the
 * proposal list uses the icon alone because the row is already a link.
 */
export const CalldataReviewedBadge = ({
  daoId,
  proposalId,
  title,
  withLabel = false,
}: {
  daoId: DaoIdEnum;
  proposalId: string;
  title: string;
  withLabel?: boolean;
}) => {
  const { data: reviews } = useCalldataReviews(daoId);
  const review = findCalldataReview(reviews ?? [], { id: proposalId, title });

  if (!review) return null;

  if (withLabel) {
    // ponytail: divider lives here so it disappears along with the badge
    return (
      <>
        <DefaultLink href={review.url} openInNewTab>
          <BadgeCheck className="text-success size-4 shrink-0" aria-hidden />
          Calldata reviewed
        </DefaultLink>
        <BulletDivider className="bg-border-contrast" />
      </>
    );
  }

  return (
    <Tooltip asChild tooltipContent="Calldata reviewed">
      <span className="flex">
        <BadgeCheck
          className="text-success size-4 shrink-0"
          aria-label="Calldata reviewed"
        />
      </span>
    </Tooltip>
  );
};
