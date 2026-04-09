"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";

import { useProposalHeaderContext } from "@/features/governance/context/ProposalHeaderContext";
import { getVoteText } from "@/features/governance/components/proposal-overview/ProposalHeader";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { WhitelabelConnectWallet } from "@/shared/components/wallet/WhitelabelConnectWallet";
import { getWhitelabelSearchPlaceholder } from "@/shared/utils/whitelabel";

const isProposalDetailPath = (pathname: string) =>
  /\/proposals\/[^/]+/.test(pathname);

const getProposalsListPath = (pathname: string) =>
  pathname.replace(/\/proposals\/.*$/, "/proposals");

export const WhitelabelHeader = () => {
  const pathname = usePathname();
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
  });

  const onProposalDetail = isProposalDetailPath(pathname);
  const searchPlaceholder = getWhitelabelSearchPlaceholder(pathname);
  const showSearch = !onProposalDetail && !!searchPlaceholder;
  const proposalHeaderCtx = useProposalHeaderContext();

  return (
    <header className="border-border-default bg-surface-background sticky top-0 z-10 hidden h-[60px] items-center justify-between gap-6 border-b px-6 lg:flex">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {onProposalDetail ? (
          <nav className="text-body-md flex items-center gap-1.5">
            <Link
              href={getProposalsListPath(pathname)}
              className="text-link font-medium hover:underline"
            >
              Proposals
            </Link>
            <span className="text-dimmed">/</span>
            <span className="text-secondary">Proposal Detail</span>
          </nav>
        ) : showSearch ? (
          <div className="max-w-xl flex-1">
            <Input
              type="search"
              hasIcon
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-transparent bg-transparent"
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        {onProposalDetail && proposalHeaderCtx && (
          <ProposalHeaderActions ctx={proposalHeaderCtx} />
        )}
        <WhitelabelConnectWallet />
      </div>
    </header>
  );
};

const ProposalHeaderActions = ({
  ctx,
}: {
  ctx: NonNullable<ReturnType<typeof useProposalHeaderContext>>;
}) => {
  const {
    address,
    votingPower,
    proposalStatus,
    supportValue,
    snapshotLink,
    setIsVotingModalOpen,
  } = ctx;
  const isOngoing = proposalStatus.toLowerCase() === "ongoing";

  if (!address) return null;

  if (supportValue !== undefined) {
    return (
      <div className="flex items-center gap-4">
        <div className="bg-secondary h-7 w-px shrink-0" />
        <div className="flex flex-col items-end">
          <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
            You voted
          </p>
          {getVoteText(supportValue)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <p className="text-secondary flex items-center gap-2 text-[12px] font-medium leading-[16px]">
          Your voting power
        </p>
        <p className="text-primary font-inter text-[14px] font-normal not-italic leading-[20px]">
          {votingPower}
        </p>
      </div>
      {(snapshotLink !== undefined ? true : isOngoing) && (
        <Button onClick={() => setIsVotingModalOpen(true)}>
          Cast your vote
          <ArrowRight className="size-3.5" />
        </Button>
      )}
    </div>
  );
};
