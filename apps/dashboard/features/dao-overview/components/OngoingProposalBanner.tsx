"use client";

import {
  onchainProposalStatusListEnum,
  type ProposalsPathParamsDaoEnumKey,
} from "@anticapture/client";
import { useProposals } from "@anticapture/client/hooks";
import { Info } from "lucide-react";

import { BannerAlert } from "@/shared/components/design-system/alerts/banner-alert/BannerAlert";

export const OngoingProposalBanner = ({ daoId }: { daoId: string }) => {
  const { data, isLoading } = useProposals(
    daoId.toLowerCase() as ProposalsPathParamsDaoEnumKey,
    {
      limit: 1,
      status: [onchainProposalStatusListEnum.ACTIVE],
    },
  );

  const hasOngoingProposal = !isLoading && (data?.items.length ?? 0) > 0;

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
