"use client";

import { useState } from "react";
import { isAddress } from "viem";

import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { AddressChip } from "@/shared/components/decoder/AddressChip";
import { NestedBytesDecode } from "@/shared/components/decoder/NestedBytesDecode";
import { MONO_LABEL } from "@/shared/components/decoder/styles";
import { ValueCell } from "@/shared/components/decoder/ValueCell";
import type { DecodedParam } from "@/shared/components/decoder/types";
import { BadgeStatus } from "@/shared/components/design-system/badges";
import { BulletDivider } from "@/shared/components/design-system/section/bullet-divider/BulletDivider";
import type { UploadedAbiStore } from "@/shared/services/decoder";
import { cn } from "@/shared/utils/cn";
import { containerParamView } from "@/shared/utils/containerParamView";
import { shortHex } from "@/shared/utils/shortHex";

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
   * The parent card already unpacked this row's bytes into subcall rows
   * ("4 calls, unpacked below"): the note replaces the annotation and no
   * second, duplicate decode is offered.
   */
  unpackedNote?: string;
}

const LONG_RAW_THRESHOLD = 26;
/**
 * Children shown before the reader asks for the rest. Tuples are capped like
 * arrays: a 99-component tuple is as many rows, and as many identity lookups,
 * as a 99-element array.
 */
const CHILD_PREVIEW = 3;

const isArrayType = (type: string): boolean => type.endsWith("]");

/**
 * The primary reading and the secondary annotation: `10 years` · `=
 * 315,360,000 seconds`, `0x6460d40e…35f9` · copy.
 */
const splitDisplay = (
  param: DecodedParam,
): { display?: string; annotation?: string; copyAnnotation?: boolean } => {
  const human = param.humanized?.text;
  // "1e21 units of USDC" is 1,000,000,000,000,000 USDC, and reads as 1,000
  // to anyone assuming 18 decimals: the annotation says which were used.
  if (param.humanized?.kind === "tokenAmount") {
    const raw = /^\d+$/.test(param.value)
      ? BigInt(param.value).toLocaleString("en-US")
      : param.value;
    return {
      display: human,
      annotation: `${raw} raw units · ${param.humanized.decimals} decimals`,
    };
  }
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
    className="text-secondary hover:text-primary w-fit cursor-pointer text-sm leading-5 transition-colors duration-[120ms] ease-[var(--ease-decoder)]"
  >
    {children}
  </button>
);

/**
 * One decoded argument. Two layouts, chosen by the width of the params box
 * (a container query, so a card nested three levels deep behaves like a
 * phone): wide = `NAME · type · value · annotation` on one line; narrow =
 * name and type on one line, value below at full width, annotation below
 * the value. Addresses render identity chips; tuples list their fields
 * behind a 1px rail; arrays show a header with their length and the first
 * few elements, the rest on request; calldata-shaped bytes get a lazy
 * "Decode" unless the parent already unpacked them.
 */
export const ParamRow = ({
  param,
  chainId,
  explorerUrl,
  depth,
  uploadedAbis,
  hideType = false,
  unpackedNote,
}: ParamRowProps) => {
  const children = param.children;
  const isContainer = children !== undefined;
  const isArray = isContainer && isArrayType(param.type);
  const [showAll, setShowAll] = useState(false);

  const view = containerParamView(param, showAll ? null : CHILD_PREVIEW);

  const value = param.value;
  const addressValue = param.isAddress && isAddress(value) ? value : undefined;
  // Address rows render the identity chip, which carries its own copy; the
  // generic annotation column applies to plain values only.
  // A string is prose (a proposal description, a name): it wraps in full
  // rather than being middle-truncated like a hex blob.
  const isText = param.type === "string";
  const split =
    addressValue !== undefined || isContainer || isText
      ? { display: undefined, annotation: undefined, copyAnnotation: false }
      : splitDisplay(param);
  const unpacked = unpackedNote !== undefined;
  const annotation = unpacked ? unpackedNote : split.annotation;
  const copyAnnotation = !unpacked && split.copyAnnotation;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="@md:flex-row @md:items-center @md:gap-2 flex min-w-0 flex-col gap-1">
        <div className="@md:shrink-0 flex min-w-0 items-center gap-2">
          <span
            title={param.name}
            className={cn(
              "text-primary @md:shrink-0 @md:leading-5 min-w-0 truncate",
              MONO_LABEL,
              hideType ? "@md:w-10" : "@md:w-24",
            )}
          >
            {param.name}
          </span>
          {!hideType && (
            <BadgeStatus
              variant="outline"
              className="@md:min-w-20 @md:justify-center shrink-0"
            >
              {/* Arrays carry their length in the badge (`address[13]`) so
                  the header stays two items wide and the name keeps its room. */}
              {isArray
                ? param.type.replace(/\[\]$/, `[${view.length}]`)
                : param.type}
            </BadgeStatus>
          )}
          {isContainer && !isArray && (
            <span className="text-secondary shrink-0 text-sm leading-5">
              {view.length} fields
            </span>
          )}
        </div>

        {!isContainer && (
          <div className="@md:flex-row @md:items-center @md:gap-2 flex min-w-0 flex-1 flex-col gap-0.5">
            {addressValue !== undefined ? (
              <span className="flex min-w-0">
                <AddressChip
                  address={addressValue}
                  chainId={chainId}
                  explorerUrl={explorerUrl}
                  variant="plain"
                />
              </span>
            ) : isText ? (
              <p className="text-primary min-w-0 whitespace-pre-wrap break-words text-sm leading-5">
                {param.value}
              </p>
            ) : (
              // The reading wins over the raw annotation: it keeps its width
              // (up to most of the row) and the annotation absorbs the squeeze.
              <ValueCell
                display={split.display}
                raw={param.value}
                className="@md:max-w-[70%] @md:shrink-0"
              />
            )}
            {annotation && (
              <>
                <BulletDivider className="@md:block hidden shrink-0" />
                <span
                  title={annotation}
                  className="text-secondary @md:shrink-[4] min-w-0 truncate text-sm leading-5"
                >
                  {annotation}
                </span>
              </>
            )}
            {copyAnnotation && (
              <CopyAndPasteButton
                textToCopy={param.value}
                iconSize="sm"
                className="-my-1 shrink-0"
                customTooltipText={{
                  default: "Copy value",
                  copied: "Value copied!",
                }}
              />
            )}
          </div>
        )}
      </div>

      {isContainer && children.length > 0 && (
        <div className="border-border-contrast ml-1 flex min-w-0 flex-col gap-1.5 border-l pl-3">
          {view.visible.map((child, i) => (
            <ParamRow
              key={`${child.name}-${i}`}
              param={child}
              chainId={chainId}
              explorerUrl={explorerUrl}
              depth={depth}
              uploadedAbis={uploadedAbis}
              hideType={isArray}
            />
          ))}
          {view.folded > 0 && (
            <DisclosureButton onClick={() => setShowAll(true)}>
              {`Show ${view.hidden.toLocaleString("en-US")} more`}
            </DisclosureButton>
          )}
          {/* The note explains the tail the budget dropped, so it belongs
              under the last element the reader can actually reach. */}
          {view.note && view.folded === 0 && (
            <p className="text-secondary w-fit text-sm leading-5">
              {view.note.value}
            </p>
          )}
          {showAll && view.retained > CHILD_PREVIEW && (
            <DisclosureButton onClick={() => setShowAll(false)}>
              Show less
            </DisclosureButton>
          )}
        </div>
      )}

      {param.isCalldataLike && !unpacked && (
        <div className="border-border-contrast ml-1 min-w-0 border-l pl-3">
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
