"use client";

import { Button } from "@/shared/components";
import { DaoAvatarIcon } from "@/shared/components/icons";
import { DaoIdEnum } from "@/shared/types/daos";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import { GetAccountPowerQuery } from "@anticapture/graphql-client";

interface ProposalHeaderProps {
  daoId: string;
  setIsVotingModalOpen: (isOpen: boolean) => void;
  votingPower: string;
  votesOnchain: GetAccountPowerQuery["votesOnchain"] | null;
  address: string | undefined;
}

export const ProposalHeader = ({
  daoId,
  votingPower,
  votesOnchain,
  setIsVotingModalOpen,
  address,
}: ProposalHeaderProps) => {
  return (
    <div className="text-primary bg-surface-default border-border-default sticky -top-[57px] z-20 flex h-[65px] w-full shrink-0 items-center justify-between gap-6 border-b px-5 py-2 sm:top-0">
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
        {/* If wallet now connected: = don't show VP */}

        <p className="text-secondary flex items-center gap-2 whitespace-nowrap text-[14px] font-normal leading-[20px] lg:hidden">
          Your VP: <span className="text-primary">{votingPower}</span>{" "}
          {/* {daoId.toUpperCase()} voted {votesOnchain?.support} on this proposal */}
        </p>

        {address && (
          <div className="hidden flex-col items-end lg:flex">
            <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
              Your voting power
            </p>
            <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
              {votingPower}
            </p>
          </div>
        )}

        {/* If already voted: show voted badge */}
        {address ? (
          !votesOnchain?.support ? (
            <Button
              className="hidden lg:flex"
              onClick={() => setIsVotingModalOpen(true)}
            >
              Cast your vote
              <ArrowRight className="size-[14px]" />
            </Button>
          ) : (
            <div className="hidden items-center gap-4 lg:flex">
              <div className="bg-secondary ml-4 h-[28px] w-[1px] flex-shrink-0" />
              <VotedBadge vote={Number(votesOnchain?.support)} />
            </div>
          )
        ) : (
          <div className="hidden lg:flex">
            <ConnectWalletCustom />
          </div>
        )}
      </div>
    </div>
  );
};

export const VotedBadge = ({ vote }: { vote: number }) => {
  return (
    <div className="flex flex-col items-end">
      <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
        You voted
      </p>
      {getVoteText(vote)}
    </div>
  );
};

export const getVoteText = (vote: number) => {
  switch (vote) {
    case 0:
      return (
        <p className="text-error bg-surface-opacity-error font-inter rounded-full px-[6px] py-[2px] text-[12px] font-medium not-italic leading-[16px]">
          Against
        </p>
      );
    case 1:
      return (
        <p className="text-success bg-surface-opacity-success font-inter rounded-full px-[6px] py-[2px] text-[12px] font-medium not-italic leading-[16px]">
          For
        </p>
      );
    case 2:
      return (
        <p className="text-primary bg-surface-default font-inter rounded-full px-[6px] py-[2px] text-[12px] font-medium not-italic leading-[16px]">
          Abstain
        </p>
      );
  }
};
