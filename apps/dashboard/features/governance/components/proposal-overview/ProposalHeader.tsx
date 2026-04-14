"use client";

import type { GetAccountPowerQuery } from "@anticapture/graphql-client";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/components";
import { ConnectWalletCustom } from "@/shared/components/wallet/ConnectWalletCustom";
import { WhitelabelConnectWallet } from "@/shared/components/wallet/WhitelabelConnectWallet";
import { DaoIdEnum } from "@/shared/types/daos";
import { getDaoGovernanceListPath } from "@/shared/utils/whitelabel";

interface ProposalHeaderProps {
  daoId: string;
  setIsVotingModalOpen: (isOpen: boolean) => void;
  setIsQueueModalOpen: (isOpen: boolean) => void;
  setIsExecuteModalOpen: (isOpen: boolean) => void;
  votingPower: string;
  votes: GetAccountPowerQuery["votesByProposalId"] | null;
  address: string | undefined;
  proposalStatus: string;
  snapshotLink?: string | null;
  isWhitelabel?: boolean;
}

const ProposalHeaderAction = ({
  address,
  supportValue,
  proposalStatus,
  setIsVotingModalOpen,
  isWhitelabel,
}: {
  address: string | undefined;
  supportValue: number | undefined;
  proposalStatus: string;
  setIsVotingModalOpen: (isOpen: boolean) => void;
  isWhitelabel: boolean;
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

  return (
    <div className="hidden lg:flex">
      {isWhitelabel ? (
        <WhitelabelConnectWallet />
      ) : (
        <ConnectWalletCustom label={isOngoing ? undefined : "Connect wallet"} />
      )}
    </div>
  );
};

export const ProposalHeader = ({
  daoId,
  votingPower,
  votes,
  setIsVotingModalOpen,
  setIsQueueModalOpen,
  setIsExecuteModalOpen,
  address,
  proposalStatus,
  snapshotLink,
  isWhitelabel = false,
}: ProposalHeaderProps) => {
  const pathname = usePathname();
  const supportValue =
    votes?.items[0]?.support != null
      ? Number(votes.items[0].support)
      : undefined;
  const proposalListHref = getDaoGovernanceListPath({
    daoId: daoId.toUpperCase() as DaoIdEnum,
    pathname,
    isOffchain: snapshotLink !== undefined,
  });

  return (
    <div className="text-primary bg-surface-background border-border-default sticky z-20 flex h-[65px] w-full shrink-0 items-center justify-between gap-6 border-b px-5 py-2 lg:top-0">
      <div className="mx-auto flex w-full flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          {isWhitelabel ? (
            <nav className="text-body-md flex items-center gap-1.5">
              <Link
                href={proposalListHref}
                className="text-link font-medium hover:underline"
              >
                Proposals
              </Link>
              <span className="text-dimmed">/</span>
              <span className="text-secondary">
                {snapshotLink !== undefined
                  ? "Offchain proposal"
                  : "Proposal details"}
              </span>
            </nav>
          ) : (
            <Link
              href={proposalListHref}
              className="text-secondary hover:text-primary inline-flex items-center gap-2 text-[14px] font-normal leading-[20px] transition-colors"
            >
              <span>Proposals</span>
              <ChevronRight className="size-4" />
            </Link>
          )}
          {!isWhitelabel && (
            <p className="text-primary text-[14px] font-medium leading-[20px]">
              {snapshotLink !== undefined
                ? "Offchain proposal"
                : "Proposal details"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isWhitelabel ? (
            <>
              {address && (
                <div className="hidden lg:flex">
                  <WhitelabelConnectWallet />
                </div>
              )}
              <ProposalHeaderAction
                address={address}
                supportValue={
                  snapshotLink ? undefined : (supportValue ?? undefined)
                }
                proposalStatus={proposalStatus}
                setIsVotingModalOpen={setIsVotingModalOpen}
                isWhitelabel={isWhitelabel}
              />
            </>
          ) : snapshotLink ? (
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
                isWhitelabel={isWhitelabel}
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
                isWhitelabel={isWhitelabel}
              />
              {address &&
                proposalStatus === "succeeded" &&
                daoId.toUpperCase() !== DaoIdEnum.SHU && (
                  <Button
                    className="hidden lg:flex"
                    onClick={() => setIsQueueModalOpen(true)}
                  >
                    Queue Proposal
                  </Button>
                )}
              {address &&
                (proposalStatus === "pending_execution" ||
                  proposalStatus === "queued" ||
                  (proposalStatus === "succeeded" &&
                    daoId.toUpperCase() === DaoIdEnum.SHU)) && (
                  <Button
                    className="hidden lg:flex"
                    onClick={() => setIsExecuteModalOpen(true)}
                  >
                    Execute Proposal
                  </Button>
                )}
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
