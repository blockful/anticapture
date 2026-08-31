"use client";

import { isAddress, type Address } from "viem";

import { AddressChip } from "@/features/decoder/components/AddressChip";
import { CopyRawButton } from "@/features/decoder/components/CopyRawButton";
import { NestedBytesDecode } from "@/features/decoder/components/NestedBytesDecode";
import { TypeChip } from "@/features/decoder/components/TypeChip";
import { ValueCell } from "@/features/decoder/components/ValueCell";
import type { DecodedParam } from "@/features/decoder/types";
import { shortHex } from "@/features/decoder/utils/shortHex";
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

const LONG_RAW_THRESHOLD = 26;

/**
 * The primary reading and the dimmed right-column annotation, per Figma
 * frame 08: `10 years` | `= 315,360,000 seconds`, `6460d40e…35f9` | `[copy]`.
 */
const splitDisplay = (
  param: DecodedParam,
): { display?: string; annotation?: string; copyAnnotation?: boolean } => {
  const human = param.humanized?.text;
  if (human) {
    const eq = human.indexOf(" = ");
    if (eq > 0) {
      return { display: human.slice(0, eq), annotation: human.slice(eq + 1) };
    }
    return {
      display: human,
      annotation:
        param.value === human ? undefined : shortHex(param.value, 12, 8),
    };
  }
  if (param.value.length > LONG_RAW_THRESHOLD) {
    return { display: shortHex(param.value, 10, 6), copyAnnotation: true };
  }
  return {};
};

/**
 * One decoded argument: name, aligned type chip, value, and a right-aligned
 * dimmed annotation. Addresses render identity chips; tuples and arrays
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
  const { display, annotation, copyAnnotation } = splitDisplay(param);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-primary w-24 shrink-0 break-all font-mono text-sm font-medium leading-5">
          {param.name}
        </span>
        <TypeChip type={param.type} className="w-20 justify-center" />
        {param.isAddress && isAddress(param.value) ? (
          <span className="min-w-0">
            <AddressChip
              address={param.value as Address}
              explorerUrl={explorerUrl}
            />
          </span>
        ) : (
          <ValueCell
            display={display}
            raw={param.value}
            className={cn(isContainer && "text-dimmed")}
          />
        )}
        {annotation && (
          <span className="text-dimmed ml-auto hidden shrink-[4] truncate text-right font-mono text-xs leading-5 sm:block">
            {annotation}
          </span>
        )}
        {copyAnnotation && (
          <span className="ml-auto hidden sm:block">
            <CopyRawButton
              textToCopy={param.value}
              label="copy"
              className="normal-case tracking-normal"
            />
          </span>
        )}
      </div>

      {param.children && param.children.length > 0 && (
        <div className="border-border-contrast ml-2 flex min-w-0 flex-col gap-1.5 border-l pl-3">
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
