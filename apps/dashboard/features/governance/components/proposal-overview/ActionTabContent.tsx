"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { isAddress, type Address } from "viem";

import { ProposalActionsInfoCard } from "@/features/governance/components/proposal-overview/ProposalActionsInfoCard";
import {
  AddressChip,
  CollapsedActionRow,
  DecodedActionCard,
  DecoderCardSkeleton,
  ExpandToggle,
} from "@/shared/components/decoder";
import { CodeBlock } from "@/shared/components/design-system/code-block/CodeBlock";
import { useActionExpansion } from "@/shared/hooks/useActionExpansion";
import { buildCollapsedRowLabel } from "@/shared/utils/collapsedRowLabel";
import type { ProposalDetails } from "@/features/governance/types";
import daoConfigByDaoId from "@/shared/dao-config";
import { useDecodedCalldata } from "@/shared/hooks/useDecodedCalldata";
import { useDelayedFlag } from "@/shared/hooks/useDelayedFlag";
import { useTokenMeta } from "@/shared/hooks/useTokenMeta";
import { applyTokenMeta, collectTokenHints } from "@/shared/services/decoder";
import { humanizeEtherValue } from "@/shared/services/decoder/humanize";
import type { DaoIdEnum } from "@/shared/types/daos";

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

const ACTION_LABEL =
  "text-primary font-mono text-xs font-medium uppercase leading-4 tracking-wider";

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
              <p className="text-dimmed font-mono text-xs uppercase leading-4 tracking-wider">
                {targets.length} actions
              </p>
              <button
                type="button"
                onClick={() =>
                  everythingOpen ? collapseAll() : expandAll(targets.length)
                }
                className="text-secondary hover:text-primary cursor-pointer font-mono text-xs uppercase leading-4 tracking-wider transition-colors duration-[120ms] ease-[var(--ease-decoder)] focus-visible:shadow-[var(--shadow-focus-ring)] focus-visible:outline-none"
              >
                {everythingOpen ? "[– collapse all]" : "[+ expand all]"}
              </button>
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
  const { data } = useDecodedCalldata({
    chainId,
    target: validTarget,
    calldata: calldata ?? "0x",
    value: toBigInt(value),
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
        className="border-border-default bg-surface-default flex w-full flex-col gap-3 border p-3"
      >
        <div className="flex items-center gap-2">
          {actionLabel}
          <span className="ml-auto">{collapseControl}</span>
        </div>
        {validTarget && (
          <div className="flex w-full items-center gap-2">
            <p className="text-primary min-w-22 shrink-0 font-mono text-sm leading-5">
              target:
            </p>
            <span className="flex min-w-0">
              <AddressChip
                address={validTarget}
                explorerUrl={blockExplorerUrl}
              />
            </span>
          </div>
        )}
        {value != null && (
          <div className="flex w-full gap-2">
            <p className="text-primary min-w-22 shrink-0 font-mono text-sm leading-5">
              value:
            </p>
            <p className="text-secondary min-w-0 break-all font-mono text-sm leading-5">
              {formatPendingValue(value)}
            </p>
          </div>
        )}
        {calldata && (
          <CodeBlock code={calldata} codeClassName="max-h-40 overflow-y-auto" />
        )}
        {showSkeleton && <DecoderCardSkeleton rows={2} />}
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
