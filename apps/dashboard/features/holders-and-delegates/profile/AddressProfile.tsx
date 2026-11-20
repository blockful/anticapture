"use client";

import { proposalsActivityPathParamsDaoEnum } from "@anticapture/client";
import { UserX } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { Address } from "viem";

import { VoteComposition } from "@/features/holders-and-delegates/delegate/drawer/vote-composition/VoteComposition";
import { DelegateProposalsActivity } from "@/features/holders-and-delegates/delegate/drawer/votes/DelegateProposalsActivity";
import { VotingPowerHistory } from "@/features/holders-and-delegates/delegate/drawer/voting-power-history/VotingPowerHistory";
import { useResetProfileTabFilters } from "@/features/holders-and-delegates/hooks/useResetProfileTabFilters";
import { AddressActivityFeed } from "@/features/holders-and-delegates/profile/components/AddressActivityFeed";
import { ProfileHeader } from "@/features/holders-and-delegates/profile/components/ProfileHeader";
import { ProfileSummary } from "@/features/holders-and-delegates/profile/components/ProfileSummary";
import { useAddressProfileSummary } from "@/features/holders-and-delegates/profile/hooks/useAddressProfileSummary";
import { isServedBy } from "@/features/holders-and-delegates/profile/utils/isServedBy";
import { BalanceHistory } from "@/features/holders-and-delegates/token-holder/drawer/balance-history/BalanceHistory";
import { DelegationHistory } from "@/features/holders-and-delegates/token-holder/drawer/delegation-history/DelegationHistory";
import { TopInteractions } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/TopInteractions";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { TabGroup } from "@/shared/components/design-system/tabs/tab-group/TabGroup";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type ProfileTab = {
  value: string;
  label: string;
  content: ReactNode;
};

type AddressProfileProps = {
  daoId: DaoIdEnum;
  address: Address;
};

/**
 * Address explorer within one DAO: who the address is, what it holds and
 * delegates, and its full governance history. The tabs are the panels of the
 * former profile drawer, delegate and token holder views merged, since any
 * address can be both.
 */
export const AddressProfile = ({ daoId, address }: AddressProfileProps) => {
  const summary = useAddressProfileSummary({ daoId, address });
  const tabs = useProfileTabs({ daoId, address });
  const resetTabFilters = useResetProfileTabFilters();

  const [tabParam, setTabParam] = useQueryState("tab", parseAsString);
  // A shared URL can name a tab this DAO does not have (`activity` without a
  // feed), so fall back to the first one instead of an empty panel.
  const activeTab = tabs.find((tab) => tab.value === tabParam) ?? tabs[0];

  // A link straight to a later tab (`?tab=activity`) would otherwise leave
  // the selected tab scrolled out of the row on narrow screens.
  const tabRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = tabRowRef.current;
    const selected = row?.querySelector('[aria-selected="true"]');
    if (!row || !selected) return;
    // Horizontal only: scrollIntoView would also scroll the page down to the
    // tab row on load.
    const rowBox = row.getBoundingClientRect();
    const tabBox = selected.getBoundingClientRect();
    if (tabBox.right > rowBox.right || tabBox.left < rowBox.left) {
      row.scrollLeft += tabBox.left - rowBox.left;
    }
  }, [activeTab.value]);

  const handleTabChange = (value: string) => {
    resetTabFilters();
    // The first tab is the default: no param keeps the canonical URL clean.
    void setTabParam(value === tabs[0].value ? null : value);
  };

  const daoName = daoConfigByDaoId[daoId].name;

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-5 lg:p-5">
      <ProfileHeader
        daoId={daoId}
        address={address}
        reportPanel={summary.hasNoActivity ? "Profile" : activeTab.label}
      />

      {summary.hasNoActivity ? (
        <BlankSlate
          variant="title"
          icon={UserX}
          title={`No activity in ${daoName}`}
          description={`This address never held, delegated or voted with ${daoName} tokens.`}
          className="py-10"
        />
      ) : (
        <>
          <ProfileSummary daoId={daoId} address={address} summary={summary} />

          <div className="flex flex-col">
            {/* Scrolls sideways on phones instead of wrapping the tab row. */}
            <div ref={tabRowRef} className="overflow-x-auto">
              <TabGroup
                tabs={tabs.map(({ value, label }) => ({ value, label }))}
                activeTab={activeTab.value}
                onTabChange={handleTabChange}
                className="w-max min-w-full"
              />
            </div>
            {/* The panels come from the drawer and scroll inside a bounded
                box, so the page gives them one. */}
            <div
              role="tabpanel"
              aria-label={activeTab.label}
              className="flex h-[75dvh] min-h-[480px] flex-col"
            >
              {activeTab.content}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const useProfileTabs = ({
  daoId,
  address,
}: AddressProfileProps): ProfileTab[] => {
  const daoConfig = daoConfigByDaoId[daoId];
  const servesVotes = isServedBy(proposalsActivityPathParamsDaoEnum, daoId);
  // Only DAO APIs that register `feed()` serve GET /:dao/feed/events.
  const hasActivityFeed = Boolean(daoConfig.activityFeed);

  return [
    ...(servesVotes
      ? [
          {
            value: "votes",
            label: "Votes",
            content: (
              <DelegateProposalsActivity
                address={address}
                daoId={daoId}
                withMetrics={false}
              />
            ),
          },
        ]
      : []),
    {
      value: "voting-power",
      label: "Voting power",
      content: <VoteComposition address={address} daoId={daoId} />,
    },
    {
      value: "voting-power-history",
      label: "Voting power history",
      content: <VotingPowerHistory accountId={address} daoId={daoId} />,
    },
    {
      value: "delegations",
      label: "Delegations",
      content: <DelegationHistory address={address} daoId={daoId} />,
    },
    {
      value: "balance",
      label: "Balance & transfers",
      content: <BalanceHistory accountId={address} daoId={daoId} />,
    },
    {
      value: "interactions",
      label: "Top interactions",
      content: <TopInteractions address={address} daoId={daoId} />,
    },
    ...(hasActivityFeed
      ? [
          {
            value: "activity",
            label: "Activity",
            content: <AddressActivityFeed address={address} daoId={daoId} />,
          },
        ]
      : []),
  ];
};
