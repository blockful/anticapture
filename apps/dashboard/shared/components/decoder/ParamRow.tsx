"use client";

import { useState } from "react";
import { isAddress, type Address } from "viem";

import { AddressChip } from "@/shared/components/decoder/AddressChip";
import { CopyRawButton } from "@/shared/components/decoder/CopyRawButton";
import { NestedBytesDecode } from "@/shared/components/decoder/NestedBytesDecode";
import { TypeChip } from "@/shared/components/decoder/TypeChip";
import { ValueCell } from "@/shared/components/decoder/ValueCell";
import type { DecodedParam } from "@/shared/components/decoder/types";
import { shortHex } from "@/shared/utils/shortHex";
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
  /** Array elements: the type is on the array header, not on every row. */
  hideType?: boolean;
  /**
   * The parent card already unpacked this call's payload into subcall cards,
   * so calldata-shaped bytes must not offer a second, duplicate decode.
   */
  suppressNestedDecode?: boolean;
}

const LONG_RAW_THRESHOLD = 26;
/** Array elements shown before the reader asks for the rest. */
const ARRAY_PREVIEW = 3;

const isArrayType = (type: string): boolean => type.endsWith("]");

/**
 * The primary reading and the dimmed annotation, per Figma frame 08:
 * `10 years` | `= 315,360,000 seconds`, `6460d40e…35f9` | `[copy]`.
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

const DisclosureButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="text-secondary hover:text-primary w-fit cursor-pointer font-mono text-xs leading-4 tracking-wider transition-colors duration-[120ms] ease-[var(--ease-decoder)]"
  >
    {children}
  </button>
);

/**
 * One decoded argument. Two layouts, chosen by the width of the params box
 * (a container query, so a card nested three levels deep behaves like a
 * phone): wide = `name · type · value · annotation` on one line, per frame 08;
 * narrow = name and type on one line, value below at full width, annotation
 * below the value. Addresses render identity chips; tuples list their fields
 * behind a 1px rail; arrays show a header with their length and the first
 * few elements, the rest on request; calldata-shaped bytes get a lazy
 * "[+ decode]" unless the parent already unpacked them.
 */
export const ParamRow = ({
  param,
  chainId,
  explorerUrl,
  depth,
  uploadedAbis,
  hideType = false,
  suppressNestedDecode = false,
}: ParamRowProps) => {
  const children = param.children;
  const isContainer = children !== undefined;
  const isArray = isContainer && isArrayType(param.type);
  const [showAll, setShowAll] = useState(false);
  const visibleChildren =
    isArray && !showAll ? (children ?? []).slice(0, ARRAY_PREVIEW) : children;
  const hiddenCount = (children?.length ?? 0) - (visibleChildren?.length ?? 0);

  const isAddressValue = Boolean(param.isAddress && isAddress(param.value));
  // Address rows render the identity chip, which carries its own [copy]; the
  // generic annotation column applies to plain values only.
  const { display, annotation, copyAnnotation } =
    isAddressValue || isContainer
      ? { display: undefined, annotation: undefined, copyAnnotation: false }
      : splitDisplay(param);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="@md:flex-row @md:items-center @md:gap-3 flex min-w-0 flex-col gap-1">
        <div className="@md:shrink-0 flex min-w-0 items-center gap-2">
          <span
            title={param.name}
            className={cn(
              "text-primary @md:shrink-0 min-w-0 truncate font-mono text-sm font-medium leading-5",
              hideType ? "@md:w-10" : "@md:w-24",
            )}
          >
            {param.name}
          </span>
          {!hideType && (
            <TypeChip
              // Arrays carry their length in the chip (`address[13]`) so the
              // header stays two items wide and the name keeps its room.
              type={
                isArray
                  ? param.type.replace(/\[\]$/, `[${children.length}]`)
                  : param.type
              }
              className="@md:w-20 @md:justify-center shrink-0"
            />
          )}
          {isContainer && !isArray && (
            <span className="text-dimmed shrink-0 font-mono text-xs leading-4">
              {children.length} fields
            </span>
          )}
        </div>

        {!isContainer && (
          <div className="@md:flex-row @md:items-center @md:gap-3 flex min-w-0 flex-1 flex-col gap-0.5">
            {isAddressValue ? (
              <span className="flex min-w-0">
                <AddressChip
                  address={param.value as Address}
                  explorerUrl={explorerUrl}
                />
              </span>
            ) : (
              // The reading wins over the raw annotation: it keeps its width
              // (up to most of the row) and the annotation absorbs the squeeze.
              <ValueCell
                display={display}
                raw={param.value}
                className="@md:max-w-[70%] @md:shrink-0"
              />
            )}
            {annotation && (
              <span
                title={annotation}
                className="text-dimmed @md:ml-auto @md:shrink-[4] @md:text-right min-w-0 truncate font-mono text-xs leading-4"
              >
                {annotation}
              </span>
            )}
            {copyAnnotation && (
              <span className="@md:ml-auto shrink-0">
                <CopyRawButton
                  textToCopy={param.value}
                  label="copy"
                  className="normal-case tracking-normal"
                />
              </span>
            )}
          </div>
        )}
      </div>

      {visibleChildren && children && children.length > 0 && (
        <div className="border-border-contrast ml-1 flex min-w-0 flex-col gap-1.5 border-l pl-3">
          {visibleChildren.map((child, i) => (
            <ParamRow
              key={`${child.name}-${i}`}
              param={child}
              chainId={chainId}
              explorerUrl={explorerUrl}
              depth={depth}
              uploadedAbis={uploadedAbis}
              hideType={isArray}
              suppressNestedDecode={suppressNestedDecode}
            />
          ))}
          {hiddenCount > 0 && (
            <DisclosureButton onClick={() => setShowAll(true)}>
              {`[+ show ${hiddenCount} more]`}
            </DisclosureButton>
          )}
          {isArray && showAll && children.length > ARRAY_PREVIEW && (
            <DisclosureButton onClick={() => setShowAll(false)}>
              [– show less]
            </DisclosureButton>
          )}
        </div>
      )}

      {param.isCalldataLike &&
        (suppressNestedDecode ? (
          <p className="text-dimmed ml-1 pl-3 font-mono text-xs leading-4">
            decoded as a nested call below ↓
          </p>
        ) : (
          <div className="border-border-contrast ml-1 min-w-0 border-l pl-3">
            <NestedBytesDecode
              calldata={param.value}
              chainId={chainId}
              explorerUrl={explorerUrl}
              depth={depth}
              uploadedAbis={uploadedAbis}
            />
          </div>
        ))}
    </div>
  );
};
