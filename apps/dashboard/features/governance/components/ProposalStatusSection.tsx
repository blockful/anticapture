import { GetProposalQuery } from "@anticapture/graphql-client";
import { Loader } from "lucide-react";
import { ProposalTimeline } from "@/features/governance/components/ProposalTimeline";

export const ProposalStatusSection = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  return (
    <div className="border-surface-default flex w-full flex-col gap-3 border p-3">
      <div className="flex items-center gap-2">
        <Loader className="text-secondary size-4" />
        <p className="text-secondary font-inter text-[14px] font-normal uppercase not-italic leading-[20px]">
          Status
        </p>
      </div>

      <ProposalTimeline proposal={proposal} />
    </div>
  );
};
