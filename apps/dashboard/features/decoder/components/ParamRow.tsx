"use client";

import { isAddress, type Address } from "viem";

import { AddressChip } from "@/features/decoder/components/AddressChip";
import { NestedBytesDecode } from "@/features/decoder/components/NestedBytesDecode";
import { TypeChip } from "@/features/decoder/components/TypeChip";
import { ValueCell } from "@/features/decoder/components/ValueCell";
import type { DecodedParam } from "@/features/decoder/types";
import type { UploadedAbiStore } from "@/shared/services/decoder";
import { cn } from "@/shared/utils/cn";

interface ParamRowProps {
  param: DecodedParam;
  chainId: number;
  explorerUrl?: string;
  /** Card depth, forwarded so lazy nested decodes respect the global limit. */
  depth: number;
  /** Forwarded so lazy nested decodes see the user's uploaded ABI. */
  uploadedAbis?: UploadedAbiStore;
}

/**
 * One decoded argument: name, aligned type chip, then the value — an identity
 * chip for addresses, humanized-first text otherwise. Tuples and arrays
 * indent their children behind a 1px left rail (same idiom as ArgInput), and
 * calldata-shaped bytes get a lazy "[+ decode]" affordance.
 */
export const ParamRow = ({
  param,
  chainId,
  explorerUrl,
  depth,
  uploadedAbis,
}: ParamRowProps) => {
  const isContainer = param.children !== undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div
        className={cn(
          "grid min-w-0 grid-cols-[minmax(5rem,max-content)_5.5rem_minmax(0,1fr)] items-baseline gap-2",
        )}
      >
        <span className="text-primary break-all font-mono text-sm leading-5">
          {param.name}
        </span>
        <TypeChip type={param.type} />
        {param.isAddress && isAddress(param.value) ? (
          <span className="min-w-0">
            <AddressChip
              address={param.value as Address}
              explorerUrl={explorerUrl}
            />
          </span>
        ) : (
          <ValueCell
            humanized={param.humanized?.text}
            raw={param.value}
            className={cn(isContainer && "text-dimmed")}
          />
        )}
      </div>

      {param.children && param.children.length > 0 && (
        <div className="border-border-contrast ml-2 flex min-w-0 flex-col gap-1 border-l pl-3">
          {param.children.map((child, i) => (
            <ParamRow
              key={`${child.name}-${i}`}
              param={child}
              chainId={chainId}
              explorerUrl={explorerUrl}
              depth={depth}
              uploadedAbis={uploadedAbis}
            />
          ))}
        </div>
      )}

      {param.isCalldataLike && (
        <div className="border-border-contrast ml-2 min-w-0 border-l pl-3">
          <NestedBytesDecode
            calldata={param.value}
            chainId={chainId}
            explorerUrl={explorerUrl}
            depth={depth}
            uploadedAbis={uploadedAbis}
          />
        </div>
      )}
    </div>
  );
};
