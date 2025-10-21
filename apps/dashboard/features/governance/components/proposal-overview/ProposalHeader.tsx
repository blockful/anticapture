"use client";

import { Button } from "@/shared/components";
import { VotingModal } from "@/features/governance";
import { type Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { DaoIdEnum } from "@/shared/types/daos";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import { useVoterInfo } from "@/features/governance/hooks/useAccountPower";

interface ProposalHeaderProps {
  daoId: string;
  proposal: Query_Proposals_Items_Items;
}

export const ProposalHeader = ({
  proposal: proposal,
  daoId,
}: ProposalHeaderProps) => {
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const { address } = useAccount();

  const { votingPower, votesOnchain } = useVoterInfo({
    address: address || "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
    daoId: daoId.toUpperCase() as DaoIdEnum,
    proposalId: proposal.id,
  });

  return (
    <div className="text-primary border-border-default flex h-[60px] w-full items-center justify-between gap-6 border-b px-5 py-2">
      <div className="flex items-center gap-2">
        <Link
          href={`/${daoId}/governance`}
          className="hover:bg-surface-default p-2 transition-colors duration-300"
        >
          <ArrowLeft className="size-[14px]" />
        </Link>

        <DaoAvatarIcon
          daoId={daoId.toUpperCase() as DaoIdEnum}
          className="size-icon-sm"
          isRounded
        />
        <p className="text-secondary text-[14px] font-normal leading-[20px]">
          {daoId.toUpperCase()}&apos;s proposal details
        </p>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-secondary flex items-center gap-2 text-[14px] font-normal leading-[20px]">
          your voting power is {votingPower} {daoId.toUpperCase()} voted{" "}
          {votesOnchain?.support} on this proposal
        </p>

        {address ? (
          <Button onClick={() => setIsVotingModalOpen(true)}>
            Cast your vote
            <ArrowRight className="size-[14px]" />
          </Button>
        ) : (
          <div>
            <ConnectWalletCustom />
          </div>
        )}
      </div>

      <VotingModal
        isOpen={isVotingModalOpen}
        onClose={() => setIsVotingModalOpen(false)}
        proposal={proposal}
      />
    </div>
  );
};
