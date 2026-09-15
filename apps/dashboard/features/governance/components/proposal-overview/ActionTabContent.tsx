"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { isAddress, type Address } from "viem";

import { ProposalActionsInfoCard } from "@/features/governance/components/proposal-overview/ProposalActionsInfoCard";
import type { ProposalDetails } from "@/features/governance/types";
import {
  AddressChip,
  CollapsedActionRow,
  DecodedActionCard,
  DecoderCardSkeleton,
  ExpandToggle,
  MONO_LABEL,
} from "@/shared/components/decoder";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { CodeBlock } from "@/shared/components/design-system/code-block/CodeBlock";
import daoConfigByDaoId from "@/shared/dao-config";
import { useActionExpansion } from "@/shared/hooks/useActionExpansion";
import { useDecodedCalldata } from "@/shared/hooks/useDecodedCalldata";
import { useDelayedFlag } from "@/shared/hooks/useDelayedFlag";
import { useTokenMeta } from "@/shared/hooks/useTokenMeta";
import { applyTokenMeta, collectTokenHints } from "@/shared/services/decoder";
import { humanizeEtherValue } from "@/shared/services/decoder/humanize";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils/cn";
import { buildCollapsedRowLabel } from "@/shared/utils/collapsedRowLabel";

const toBigInt = (value: string | null): bigint | undefined => {
  if (value == null) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
};

/** ETH reading for the pending fallback; the raw string when unparseable. */
const formatPendingValue = (value: string): string => {
  const wei = toBigInt(value);
  if (wei === undefined) return value;
  return wei > 0n ? humanizeEtherValue(wei).text : "0 ETH";
};

const ACTION_LABEL = cn("text-primary shrink-0", MONO_LABEL);
const PENDING_ROW_LABEL = cn(
  "text-primary shrink-0 md:w-22 md:leading-5",
  MONO_LABEL,
);

export const ActionsTabContent = ({
  proposal,
}: {
  proposal: ProposalDetails;
}) => {
  const { daoId } = useParams<{ daoId: string }>();
  const daoIdKey = daoId?.toUpperCase() as DaoIdEnum;
  const daoChain = daoConfigByDaoId[daoIdKey]?.daoOverview?.chain;
  const blockExplorerUrl =
    daoChain?.blockExplorers?.default?.url ?? "https://etherscan.io";
  const chainId = daoChain?.id ?? 1;

  const targets = proposal.targets ?? [];
  const values = proposal.values ?? [];
  const calldatas = proposal.calldatas ?? [];

  // A proposal is executable only when an action has a calldata to run. Some
  // DAOs (e.g. Tornado Cash) expose a target but no calldata/value; for those we
  // show the proposal's metadata instead of an empty action list.
  const hasExecutableActions = targets.some(
    (target, index) =>
      target != null &&
      values[index] != null &&
      (calldatas[index] ?? null) != null,
  );

  // Proposal ids are DAO-local, so the key carries the DAO too.
  const { isExpanded, toggle, allExpanded, expandAll, collapseAll } =
    useActionExpansion({
      storageKey: `decoder:actions:${daoIdKey ?? "dao"}:${proposal.id || "draft"}`,
    });
  const everythingOpen = allExpanded(targets.length);

  return (
    <div className="text-primary flex flex-col gap-3 py-4 lg:p-4">
      {!hasExecutableActions ? (
        <ProposalActionsInfoCard
          proposal={proposal}
          blockExplorerUrl={blockExplorerUrl}
        />
      ) : (
        <>
          {targets.length > 1 && (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className={cn("text-secondary", MONO_LABEL)}>
                {targets.length} actions
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  everythingOpen ? collapseAll() : expandAll(targets.length)
                }
              >
                {everythingOpen ? "Collapse all" : "Expand all"}
              </Button>
            </div>
          )}
          {targets.map((_, index) => (
            <ActionItem
              key={index}
              index={index}
              target={targets[index] ?? null}
              value={values[index] ?? null}
              calldata={calldatas[index] ?? null}
              chainId={chainId}
              blockExplorerUrl={blockExplorerUrl}
              expanded={isExpanded(index)}
              onToggle={() => toggle(index)}
            />
          ))}
        </>
      )}
    </div>
  );
};

interface ActionItemProps {
  target: string | null;
  value: string | null;
  calldata: string | null;
  index: number;
  chainId: number;
  blockExplorerUrl: string;
  expanded: boolean;
  onToggle: () => void;
}

const ActionItem = ({
  target,
  value,
  calldata,
  index,
  chainId,
  blockExplorerUrl,
  expanded,
  onToggle,
}: ActionItemProps) => {
  const validTarget =
    target && isAddress(target) ? (target as Address) : undefined;

  // The decode itself is cheap and cached forever per calldata hash; only the
  // heavy card UI is gated behind expansion.
  // Collapsed, the row is one sentence, and that sentence needs the names of
  // the direct children: "Executes 2 calls: transfer, approve" rather than
  // "Executes 2 calls". One level buys those names at one lookup per child;
  // recursing further would fetch an ABI for every call nested inside them,
  // so a page of twenty batched actions issues hundreds of proxy requests for
  // rows nobody has opened. Full depth arrives with the expansion.
  const { data } = useDecodedCalldata({
    chainId,
    target: validTarget,
    calldata: calldata ?? "0x",
    value: toBigInt(value),
    maxDepth: expanded ? undefined : 1,
  });
  const showSkeleton = useDelayedFlag(expanded && !data);

  const tokenHints = useMemo(
    () => (data ? collectTokenHints(data) : []),
    [data],
  );
  const { meta } = useTokenMeta(chainId, tokenHints);
  const call = useMemo(
    () => (data && meta.size > 0 ? applyTokenMeta(data, meta) : data),
    [data, meta],
  );

  const actionLabel = (
    <p className={ACTION_LABEL}>
      {"//"}Action {String(index + 1).padStart(2, "0")}
    </p>
  );
  const collapseControl = (
    <ExpandToggle
      expanded
      onToggle={onToggle}
      label={`Collapse action ${index + 1}`}
    />
  );

  if (!expanded) {
    return (
      <CollapsedActionRow
        index={index}
        target={target}
        chainId={chainId}
        label={buildCollapsedRowLabel(
          call ?? undefined,
          calldata,
          toBigInt(value),
        )}
        onExpand={onToggle}
        explorerUrl={blockExplorerUrl}
      />
    );
  }

  if (!call) {
    // The reader must never wait on remote ABI lookups to see what the action
    // IS: target, value and raw calldata render immediately; the decode is
    // progressive enhancement on top.
    return (
      <div
        id={`action-${index + 1}`}
        className="border-border-default bg-surface-default flex w-full flex-col border"
      >
        <div className="bg-surface-contrast border-border-default flex items-center gap-2 border-b px-3 py-2">
          {actionLabel}
          <span className="ml-auto">{collapseControl}</span>
        </div>
        <div className="flex w-full flex-col gap-4 p-3">
          {validTarget && (
            <div className="flex w-full flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <p className={PENDING_ROW_LABEL}>target</p>
              <span className="flex min-w-0">
                <AddressChip
                  address={validTarget}
                  chainId={chainId}
                  explorerUrl={blockExplorerUrl}
                />
              </span>
            </div>
          )}
          {value != null && (
            <div className="flex w-full flex-col gap-1 md:flex-row md:items-center md:gap-2">
              <p className={PENDING_ROW_LABEL}>value</p>
              <p className="text-primary min-w-0 break-all text-sm leading-5">
                {formatPendingValue(value)}
              </p>
            </div>
          )}
          {calldata && (
            <CodeBlock
              code={calldata}
              codeClassName="max-h-40 overflow-y-auto"
            />
          )}
          {showSkeleton && <DecoderCardSkeleton rows={2} />}
        </div>
      </div>
    );
  }

  return (
    <div id={`action-${index + 1}`}>
      <DecodedActionCard
        call={call}
        chainId={chainId}
        explorerUrl={blockExplorerUrl}
        headerLeft={actionLabel}
        headerRight={collapseControl}
      />
    </div>
  );
};
