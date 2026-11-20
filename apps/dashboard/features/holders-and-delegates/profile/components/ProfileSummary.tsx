"use client";

import {
  ArrowRightLeft,
  Check,
  Coins,
  Hand,
  Trophy,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Address } from "viem";

import { formatAvgTime } from "@/features/holders-and-delegates/delegate/drawer/votes/DelegateProposalsActivity";
import type {
  AddressProfileSummary,
  SummaryMetric,
} from "@/features/holders-and-delegates/profile/hooks/useAddressProfileSummary";
import { AddressLink } from "@/shared/components/address/AddressLink";
import { MetricCard } from "@/shared/components/cards/MetricCard";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

type ProfileSummaryProps = {
  daoId: DaoIdEnum;
  address: Address;
  summary: AddressProfileSummary;
  /** Extra participation cards (e.g. Snapshot), next to the onchain votes. */
  extraParticipation?: ReactNode;
};

/**
 * Renders one metric for a card: undefined keeps the card's skeleton while
 * loading, failures and unsupported metrics read as such instead of a zero.
 */
const renderMetric = <T,>(
  metric: SummaryMetric<T>,
  render: (value: T) => ReactNode,
): ReactNode => {
  if (metric.status === "loading") return undefined;
  if (metric.status === "error")
    return <span className="text-secondary">Unavailable</span>;
  if (metric.status === "unsupported")
    return <span className="text-secondary">Not tracked</span>;
  return render(metric.value);
};

const formatShare = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : "0%";

export const ProfileSummary = ({
  daoId,
  address,
  summary,
  extraParticipation,
}: ProfileSummaryProps) => {
  const { votingPower, balance, delegatorsCount, delegatingTo, participation } =
    summary;

  return (
    <div className="flex flex-col gap-3">
      <SummaryGroup title="Holdings">
        <MetricCard
          icon={<Zap className="size-3.5" />}
          title="Voting power"
          value={renderMetric(votingPower, (value) =>
            formatNumberUserReadable(value),
          )}
        />
        <MetricCard
          icon={<Coins className="size-3.5" />}
          title="Token balance"
          value={renderMetric(balance, (value) =>
            formatNumberUserReadable(value ?? 0),
          )}
        />
        <MetricCard
          icon={<Users className="size-3.5" />}
          title="Delegators"
          value={renderMetric(delegatorsCount, (value) =>
            value.toLocaleString("en-US"),
          )}
        />
        <MetricCard
          icon={<ArrowRightLeft className="size-3.5" />}
          title="Delegating to"
          value={renderMetric(delegatingTo, (delegate) => {
            if (!delegate)
              return <span className="text-secondary">No one</span>;
            if (delegate.toLowerCase() === address.toLowerCase()) return "Self";
            return <AddressLink address={delegate} daoId={daoId} />;
          })}
        />
      </SummaryGroup>

      <SummaryGroup title="Participation">
        <MetricCard
          icon={<Hand className="size-3.5" />}
          title="Onchain votes"
          value={renderMetric(
            participation,
            ({ votedProposals, totalProposals }) =>
              `Voted ${votedProposals} of ${totalProposals} (${formatShare(votedProposals, totalProposals)})`,
          )}
        />
        {extraParticipation}
        <MetricCard
          icon={<Trophy className="size-3.5" />}
          title="Win rate"
          value={renderMetric(participation, ({ votedProposals, winRate }) =>
            votedProposals > 0 ? `${winRate.toFixed(1)}%` : "-",
          )}
        />
        <MetricCard
          icon={<Check className="size-3.5" />}
          title="For rate"
          value={renderMetric(participation, ({ votedProposals, yesRate }) =>
            votedProposals > 0 ? `${yesRate.toFixed(1)}%` : "-",
          )}
        />
        <MetricCard
          icon={<Timer className="size-3.5" />}
          title="Avg. vote timing"
          value={renderMetric(
            participation,
            ({ votedProposals, avgTimeBeforeEnd }) =>
              formatAvgTime(avgTimeBeforeEnd, votedProposals),
          )}
        />
      </SummaryGroup>
    </div>
  );
};

const SummaryGroup = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section aria-label={title} className="flex flex-col gap-1.5">
    <h2 className="text-secondary font-mono text-xs font-medium uppercase tracking-wider">
      {title}
    </h2>
    {/* Auto-fit: the participation row grows a Snapshot card on DAOs that
        vote offchain, and the cards should share the row either way. */}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
      {children}
    </div>
  </section>
);
