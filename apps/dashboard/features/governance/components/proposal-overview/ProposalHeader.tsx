"use client";

import { Button } from "@/shared/components";
import { VotingModal } from "@/features/governance";
import type { Query_Proposals_Items_Items } from "@anticapture/graphql-client/hooks";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { DaoIdEnum } from "@/shared/types/daos";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";

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

  // TODO: Use proposal data for voting logic
  // check if the proposal is active or not

  // check how much voting power the address has
  const votingPower = useVotingPower({
    daoId: daoId.toUpperCase() as DaoIdEnum,
    address: address || "",
  });

  console.log("votingPower ", votingPower);

  // check if the address has already voted or not

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
        <div>{address}</div>

        {address ? (
          <Button onClick={() => setIsVotingModalOpen(true)}>
            Cast your vote
            <ArrowRight className="size-[14px]" />
          </Button>
        ) : (
          <ConnectWalletCustom />
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
