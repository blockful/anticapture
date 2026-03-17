import type { GetProposalQuery } from "@anticapture/graphql-client";
import { Loader } from "lucide-react";
import { useParams } from "next/navigation";

import { ProposalTimeline } from "@/features/governance/components/proposal-overview/ProposalTimeline";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

export const ProposalStatusSection = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  const { daoId } = useParams<{ daoId: string }>();
  const daoIdKey = daoId?.toUpperCase() as DaoIdEnum;
  const blockExplorerUrl =
    daoConfigByDaoId[daoIdKey]?.daoOverview?.chain?.blockExplorers?.default
      ?.url ?? "https://etherscan.io";

  return (
    <div className="border-border-default flex w-full flex-col gap-3 border p-3">
      <div className="flex items-center gap-2">
        <Loader className="text-secondary size-4" />
        <p className="text-secondary font-mono text-[14px] font-normal uppercase not-italic leading-[20px]">
          Status
        </p>
      </div>

      <ProposalTimeline
        proposal={proposal}
        blockExplorerUrl={blockExplorerUrl}
      />
    </div>
  );
};
