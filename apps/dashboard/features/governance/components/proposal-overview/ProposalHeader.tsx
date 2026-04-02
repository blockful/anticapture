"use client";

import type { GetAccountPowerQuery } from "@anticapture/graphql-client";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/components";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import type { DaoIdEnum } from "@/shared/types/daos";
import {
  getDaoPagePath,
  getWhitelabelBasePath,
  WHITELABEL_ROUTES,
} from "@/shared/utils/whitelabel";

interface ProposalHeaderProps {
  daoId: string;
  setIsVotingModalOpen: (isOpen: boolean) => void;
  votingPower: string;
  votes: GetAccountPowerQuery["votesByProposalId"] | null;
  address: string | undefined;
  proposalStatus: string;
  snapshotLink?: string | null;
}

const ProposalHeaderAction = ({
  address,
  supportValue,
  proposalStatus,
  setIsVotingModalOpen,
  hideConnectWallet,
}: {
  address: string | undefined;
  supportValue: number | undefined;
  proposalStatus: string;
  setIsVotingModalOpen: (isOpen: boolean) => void;
  hideConnectWallet?: boolean;
}) => {
  const isOngoing = proposalStatus.toLowerCase() === "ongoing";

  if (address) {
    if (supportValue === undefined) {
      if (isOngoing) {
        return (
          <Button
            className="hidden lg:flex"
            onClick={() => setIsVotingModalOpen(true)}
          >
            Cast your vote
            <ArrowRight className="size-3.5" />
          </Button>
        );
      }
      return null;
    }

    return (
      <div className="hidden items-center gap-4 lg:flex">
        <div className="bg-secondary ml-4 h-7 w-px shrink-0" />
        <VotedBadge vote={Number(supportValue)} />
      </div>
    );
  }

  if (hideConnectWallet) {
    return null;
  }

  return (
    <div className="hidden lg:flex">
      <ConnectWalletCustom label={isOngoing ? undefined : "Connect wallet"} />
    </div>
  );
};

export const ProposalHeader = ({
  daoId,
  votingPower,
  votes,
  setIsVotingModalOpen,
  address,
  proposalStatus,
  snapshotLink,
}: ProposalHeaderProps) => {
  const pathname = usePathname();
  const supportValue =
    votes?.items[0]?.support != null
      ? Number(votes.items[0].support)
      : undefined;
  const isWhitelabelRoute = Boolean(
    getWhitelabelBasePath({
      daoId: daoId.toUpperCase() as DaoIdEnum,
      pathname,
    }),
  );

  return (
    <div className="text-primary bg-surface-background border-border-default sticky -top-[57px] z-20 flex h-[65px] w-full shrink-0 items-center justify-between gap-6 border-b py-2 lg:top-0">
      <div className="mx-auto flex w-full flex-1 items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Link
            href={`${getDaoPagePath({
              daoId: daoId.toUpperCase() as DaoIdEnum,
              pathname,
              page: WHITELABEL_ROUTES.proposals,
            })}${snapshotLink !== undefined ? "?tab=offchain" : ""}`}
            className="text-secondary hover:text-primary inline-flex items-center gap-2 text-[14px] font-normal leading-[20px] transition-colors"
          >
            <span>Proposals</span>
            <ChevronRight className="size-4" />
          </Link>
          <p className="text-primary text-[14px] font-medium leading-[20px]">
            {snapshotLink !== undefined
              ? "Offchain proposal"
              : "Proposal details"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {snapshotLink ? (
            <>
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
              <ProposalHeaderAction
                address={address}
                supportValue={undefined}
                proposalStatus={proposalStatus}
                setIsVotingModalOpen={setIsVotingModalOpen}
                hideConnectWallet={isWhitelabelRoute}
              />
            </>
          ) : (
            <>
              <p className="text-secondary flex items-center gap-2 whitespace-nowrap text-[14px] font-normal leading-[20px] lg:hidden">
                Your VP: <span className="text-primary">{votingPower}</span>
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

              <ProposalHeaderAction
                address={address}
                supportValue={supportValue ?? undefined}
                proposalStatus={proposalStatus}
                setIsVotingModalOpen={setIsVotingModalOpen}
                hideConnectWallet={isWhitelabelRoute}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const VotedBadge = ({ vote }: { vote: number }) => {
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
