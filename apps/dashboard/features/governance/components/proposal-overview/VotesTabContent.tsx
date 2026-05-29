"use client";

import type {
  ProposalNonVotersPathParamsDaoEnumKey,
  TokenMetricsPathParamsDaoEnumKey,
  VotesByProposalIdPathParamsDaoEnumKey,
} from "@anticapture/client";
import {
  useProposalNonVoters,
  useTokenMetrics,
  useVotesByProposalId,
} from "@anticapture/client/hooks";
import { useParams } from "next/navigation";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { formatUnits } from "viem";

import { TabsDidntVoteContent } from "@/features/governance/components/proposal-overview/TabsDidntVoteContent";
import { TabsVotedContent } from "@/features/governance/components/proposal-overview/TabsVotedContent";
import type { ProposalDetails } from "@/features/governance/types";
import { PillTab } from "@/shared/components/design-system/tabs/pill-tab/PillTab";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

type VoteTabId = "voted" | "didntVote";

interface VotesTabContentProps {
  proposal: ProposalDetails;
  onAddressClick?: (address: string) => void;
}

export const VotesTabContent = ({
  proposal,
  onAddressClick,
}: VotesTabContentProps) => {
  const [activeTab, setActiveTab] = useQueryState(
    "voteTab",
    parseAsStringEnum<VoteTabId>(["voted", "didntVote"]).withDefault("voted"),
  );

  const { daoId } = useParams<{ daoId: string }>();
  const daoIdEnum = daoId.toUpperCase() as DaoIdEnum;
  const { decimals } = daoConfig[daoIdEnum];
  const votesDaoKey =
    daoIdEnum.toLowerCase() as VotesByProposalIdPathParamsDaoEnumKey;
  const nonVotersDaoKey =
    daoIdEnum.toLowerCase() as ProposalNonVotersPathParamsDaoEnumKey;

  const { data: delegatedSupplyData } = useTokenMetrics(
    daoIdEnum.toLowerCase() as TokenMetricsPathParamsDaoEnumKey,
    {
      metricType: "DELEGATED_SUPPLY",
      endDate: Number(proposal.endTimestamp),
      orderDirection: "desc",
      limit: 1,
    },
  );

  const { data } = useVotesByProposalId(
    votesDaoKey,
    proposal.id,
    {
      limit: undefined,
      skip: undefined,
      support: undefined,
      voterAddressIn: undefined,
    },
    {
      query: {
        enabled: !!proposal.id,
      },
    },
  );

  const { data: nonVotersData } = useProposalNonVoters(
    nonVotersDaoKey,
    proposal.id,
    {
      limit: 1,
      skip: undefined,
    },
    {
      query: {
        enabled: !!proposal.id,
      },
    },
  );

  const totalVotesBigInt =
    BigInt(proposal.forVotes) +
    BigInt(proposal.againstVotes) +
    BigInt(proposal.abstainVotes);

  const historicalDelegatedSupply = delegatedSupplyData?.items?.[0]?.high;

  const delegatedSupplyBigInt = historicalDelegatedSupply
    ? BigInt(historicalDelegatedSupply)
    : null;

  const votedPercentage =
    delegatedSupplyBigInt && delegatedSupplyBigInt > 0n
      ? `${((Number(totalVotesBigInt) / Number(delegatedSupplyBigInt)) * 100).toFixed(1)}%`
      : null;

  const didntVotePercentage =
    delegatedSupplyBigInt && delegatedSupplyBigInt > 0n
      ? `${(((Number(delegatedSupplyBigInt) - Number(totalVotesBigInt)) / Number(delegatedSupplyBigInt)) * 100).toFixed(1)}%`
      : null;

  const totalVotes = formatNumberUserReadable(
    Number(formatUnits(totalVotesBigInt, decimals)),
  );

  const nonVoterVotingPower =
    delegatedSupplyBigInt != null
      ? formatNumberUserReadable(
          Number(
            formatUnits(delegatedSupplyBigInt - totalVotesBigInt, decimals),
          ),
        )
      : null;

  return (
    <div className="text-primary flex w-full flex-col gap-3 py-4 lg:p-4">
      <div role="tablist" className="flex items-center gap-2">
        <PillTab
          className="w-full"
          label="Voted"
          isActive={activeTab === "voted"}
          onClick={() => setActiveTab("voted")}
          counter={
            data?.totalCount != null
              ? {
                  voters: `${data.totalCount}`,
                  vp: `${totalVotes} VP`,
                  percentage: votedPercentage ?? "-",
                }
              : undefined
          }
        />
        <PillTab
          className="w-full"
          label="Didn't vote"
          isActive={activeTab === "didntVote"}
          onClick={() => setActiveTab("didntVote")}
          counter={
            nonVotersData?.totalCount != null
              ? {
                  voters: `${nonVotersData.totalCount}`,
                  vp:
                    nonVoterVotingPower != null
                      ? `${nonVoterVotingPower} VP`
                      : "-",
                  percentage: didntVotePercentage ?? "-",
                }
              : undefined
          }
        />
      </div>

      <div className="flex flex-col gap-3">
        {activeTab === "voted" ? (
          <TabsVotedContent
            proposal={proposal}
            onAddressClick={onAddressClick}
          />
        ) : (
          <TabsDidntVoteContent
            proposal={proposal}
            onAddressClick={onAddressClick}
          />
        )}
      </div>
    </div>
  );
};
