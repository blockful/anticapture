"use client";

import {
  useGetProposalsFromDaoQuery,
  QueryInput_Proposals_Status_Items,
} from "@anticapture/graphql-client/hooks";
import { Info } from "lucide-react";

import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";

export const OngoingProposalBanner = ({ daoId }: { daoId: string }) => {
  const { data, loading } = useGetProposalsFromDaoQuery({
    variables: {
      limit: 1,
      status: QueryInput_Proposals_Status_Items.Active,
      skip: null,
      fromDate: null,
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
      links={{
        url: `/${daoId.toLowerCase()}/proposals`,
        text: "View proposals",
        openInNewTab: false,
      }}
    />
  );
};
