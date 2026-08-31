"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { isAddress, type Address } from "viem";

import {
  AddressChip,
  CollapsedActionRow,
  DecodedActionCard,
  DecoderCardSkeleton,
} from "@/features/decoder";
import { CodeBlock } from "@/shared/components/design-system/code-block/CodeBlock";
import { useActionExpansion } from "@/features/decoder/hooks/useActionExpansion";
import { buildCollapsedRowLabel } from "@/features/decoder/utils/collapsedRowLabel";
import { ProposalActionsInfoCard } from "@/features/governance/components/proposal-overview/ProposalActionsInfoCard";
import type { ProposalDetails } from "@/features/governance/types";
import daoConfigByDaoId from "@/shared/dao-config";
import { useDecodedCalldata } from "@/shared/hooks/useDecodedCalldata";
import { useDelayedFlag } from "@/shared/hooks/useDelayedFlag";
import { useTokenMeta } from "@/shared/hooks/useTokenMeta";
import { applyTokenMeta, collectTokenHints } from "@/shared/services/decoder";
import type { DaoIdEnum } from "@/shared/types/daos";

const toBigInt = (value: string | null): bigint | undefined => {
  if (value == null) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
};

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
  const { isExpanded, toggle } = useActionExpansion({
    storageKey: `decoder:actions:${daoIdKey ?? "dao"}:${proposal.id || "draft"}`,
  });

  return (
    <div className="text-primary flex flex-col gap-3 py-4 lg:p-4">
      {!hasExecutableActions ? (
        <ProposalActionsInfoCard
          proposal={proposal}
          blockExplorerUrl={blockExplorerUrl}
        />
      ) : (
        targets.map((_, index) => (
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
        ))
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

  if (!expanded) {
    return (
      <CollapsedActionRow
        index={index}
        target={target}
        label={buildCollapsedRowLabel(call ?? undefined, calldata)}
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
        <p className="text-primary font-mono text-xs font-medium uppercase leading-4 tracking-wider">
          {"// "}Action {index + 1}
        </p>
        {validTarget && (
          <div className="flex w-full items-center gap-2">
            <p className="text-primary min-w-22 shrink-0 font-mono text-sm leading-5">
              target:
            </p>
            <span className="min-w-0">
              <AddressChip
                address={validTarget}
                explorerUrl={blockExplorerUrl}
              />
            </span>
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
        headerLeft={
          <p className="text-primary font-mono text-xs font-medium uppercase leading-4 tracking-wider">
            {"// "}Action {index + 1}
          </p>
        }
        headerRight={
          <button
            type="button"
            onClick={onToggle}
            aria-label={`Collapse action ${index + 1}`}
            className="text-secondary hover:text-primary cursor-pointer font-mono text-xs font-medium uppercase leading-4 tracking-wider transition-colors duration-[120ms] ease-[var(--ease-decoder)]"
          >
            [–]
          </button>
        }
      />
    </div>
  );
};
