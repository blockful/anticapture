"use client";

import { useGetProposalsFromDaoQuery } from "@anticapture/graphql-client/hooks";
import { Info } from "lucide-react";

import { ProposalStatus } from "@/features/governance";
import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";

export const OngoingProposalBanner = ({ daoId }: { daoId: string }) => {
  const { data, loading } = useGetProposalsFromDaoQuery({
    variables: {
      limit: 1,
      status: ProposalStatus.ONGOING,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  const hasOngoingProposal =
    !loading && (data?.proposals?.items?.length ?? 0) > 0;

  if (!hasOngoingProposal) {
    return null;
  }

  return (
    <BannerAlert
      icon={<Info className="size-4" />}
      text="This DAO has an ongoing proposal, cast your vote now."
      storageKey={`banner-dismissed-${daoId}`}
      link={{
        url: `/${daoId.toLowerCase()}/governance`,
        text: "View proposals",
        openInNewTab: false,
      }}
    />
  );
};
