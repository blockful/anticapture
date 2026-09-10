"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { ChipCluster } from "@/shared/components/decoder/ChipCluster";
import { CopyRawButton } from "@/shared/components/decoder/CopyRawButton";
import { AddressChip } from "@/shared/components/decoder/AddressChip";
import { DecodedRawToggle } from "@/shared/components/decoder/DecodedRawToggle";
import { ExpandToggle } from "@/shared/components/decoder/ExpandToggle";
import { ParamRow } from "@/shared/components/decoder/ParamRow";
import { RawView } from "@/shared/components/decoder/RawView";
import { SummaryRow } from "@/shared/components/decoder/SummaryRow";
import { ValueCell } from "@/shared/components/decoder/ValueCell";
import type { DecodedCall, ViewMode } from "@/shared/components/decoder/types";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { humanizeEtherValue } from "@/shared/services/decoder/humanize";
import type { UploadedAbiStore } from "@/shared/services/decoder";
import { cn } from "@/shared/utils/cn";

interface DecodedActionCardProps {
  call: DecodedCall;
  chainId: number;
  explorerUrl?: string;
  /** Embedded mode passes the "// Action N" label; nested cards label themselves. */
  headerLeft?: ReactNode;
  /** Extra header actions (the embedded collapse control). */
  headerRight?: ReactNode;
  defaultView?: ViewMode;
  className?: string;
  /** Forwarded to lazy nested decodes so an uploaded ABI applies there too. */
  uploadedAbis?: UploadedAbiStore;
}

const MONO_LABEL =
  "font-mono text-xs font-medium uppercase leading-4 tracking-wider";

/** Signatures with more params than this collapse to `name(…) · N params`. */
const SIGNATURE_INLINE_MAX_PARAMS = 4;

const RowLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-primary min-w-22 shrink-0 font-mono text-sm leading-5">
    {children}
  </p>
);

/**
 * A labelled row. Root cards keep frame 08's left label column; nested cards
 * stack the label above the content as a dimmed eyebrow, because every
 * left column a level adds is width the deepest value no longer has.
 */
const Row = ({
  label,
  nested,
  align = "center",
  children,
}: {
  label: string;
  nested: boolean;
  align?: "center" | "start";
  children: ReactNode;
}) =>
  nested ? (
    <div className="flex min-w-0 flex-col gap-1">
      <p className={cn("text-dimmed", MONO_LABEL)}>{label}</p>
      {children}
    </div>
  ) : (
    <div
      className={cn(
        "flex w-full min-w-0 gap-2",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      <RowLabel>{label}:</RowLabel>
      {children}
    </div>
  );

/**
 * `register (uint256 id, address owner, uint256 duration)` when short enough
 * to read on one line; otherwise `execTransaction(…) · 10 params [show]`, since
 * every argument is already listed in the params table right below.
 */
const FunctionSignature = ({
  call,
  nested,
}: {
  call: DecodedCall;
  nested: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const namedArgs = call.params
    .map((param) => `${param.type} ${param.name}`)
    .join(", ");
  const inline =
    expanded || (!nested && call.params.length <= SIGNATURE_INLINE_MAX_PARAMS);

  return (
    <p className="text-secondary min-w-0 break-words font-mono text-sm leading-5">
      <span className="text-link">{call.functionName}</span>{" "}
      {inline ? (
        `(${namedArgs})`
      ) : (
        <>
          {"(…)"}
          <span className="text-dimmed text-xs">
            {" "}
            · {call.params.length} params{" "}
          </span>
        </>
      )}
      {call.params.length > SIGNATURE_INLINE_MAX_PARAMS || nested ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="text-dimmed hover:text-primary cursor-pointer font-mono text-xs leading-4"
        >
          {inline ? "[hide]" : "[show]"}
        </button>
      ) : null}
    </p>
  );
};

/**
 * Subcalls a wrapper unpacked. A lone subcall opens by default; several stay
 * collapsed to one summary line each, so a Timelock batch of eight Safe
 * transactions reads as a list before it reads as eight full cards.
 */
const SubcallList = ({
  subcalls,
  chainId,
  explorerUrl,
  uploadedAbis,
}: {
  subcalls: NonNullable<DecodedCall["subcalls"]>;
  chainId: number;
  explorerUrl?: string;
  uploadedAbis?: UploadedAbiStore;
}) => {
  const [open, setOpen] = useState<ReadonlySet<number>>(
    () => new Set(subcalls.length === 1 ? [subcalls[0].index] : []),
  );
  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <div className="border-border-contrast ml-1 flex min-w-0 flex-col gap-2 border-l pl-3">
      {subcalls.map((subcall) => {
        const number = String(subcall.index + 1).padStart(2, "0");
        const title = (
          <p className={cn("text-primary min-w-0 truncate", MONO_LABEL)}>
            {"//"}call {number}
            {subcall.functionName ? ` · ${subcall.functionName}` : ""}
          </p>
        );
        const isOpen = open.has(subcall.index);
        if (!isOpen) {
          return (
            <div
              key={subcall.index}
              className="border-border-contrast flex min-w-0 flex-col border"
            >
              <div className="bg-surface-contrast flex w-full items-center gap-2 px-3 py-2">
                {title}
                <ExpandToggle
                  expanded={false}
                  onToggle={() => toggle(subcall.index)}
                  label={`Expand call ${subcall.index + 1}`}
                  className="ml-auto"
                />
              </div>
              <button
                type="button"
                onClick={() => toggle(subcall.index)}
                className="hover:bg-surface-hover text-primary font-inter line-clamp-2 min-w-0 cursor-pointer px-3 py-2 text-left text-sm leading-5 transition-colors duration-[120ms] ease-[var(--ease-decoder)]"
              >
                {subcall.summary ??
                  subcall.signature ??
                  subcall.selector ??
                  "call"}
              </button>
            </div>
          );
        }
        return (
          <DecodedActionCard
            key={subcall.index}
            call={subcall}
            chainId={chainId}
            explorerUrl={explorerUrl}
            uploadedAbis={uploadedAbis}
            headerLeft={title}
            headerRight={
              <ExpandToggle
                expanded
                onToggle={() => toggle(subcall.index)}
                label={`Collapse call ${subcall.index + 1}`}
              />
            }
          />
        );
      })}
    </div>
  );
};

/**
 * The decoded calldata card: header chip cluster, summary sentence, identity
 * target row, human-first params, nested subcall cards, and the decoded|raw
 * toggle with raw hex one click away in every state.
 *
 * Nested cards (depth > 0) use a reduced anatomy: eyebrow labels instead of
 * a label column, no bordered params box, no own decoded|raw toggle (the
 * raw hex is still one click away via the header copy control).
 */
export const DecodedActionCard = ({
  call,
  chainId,
  explorerUrl,
  headerLeft,
  headerRight,
  defaultView = "decoded",
  className,
  uploadedAbis,
}: DecodedActionCardProps) => {
  const [view, setView] = useState<ViewMode>(defaultView);

  const hasError = call.error !== undefined;
  const showDecoded = view === "decoded" && !hasError;
  const isNested = call.depth > 0;
  const hasSubcalls = Boolean(call.subcalls && call.subcalls.length > 0);

  const headerLabel = headerLeft ?? (
    <p className={cn("text-primary min-w-0 truncate", MONO_LABEL)}>
      {"//"}
      {call.functionName ?? call.selector ?? "call"}
    </p>
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col border",
        isNested
          ? "border-border-contrast"
          : "border-border-default bg-surface-default",
        className,
      )}
    >
      <div
        className={cn(
          "bg-surface-contrast flex w-full items-center gap-2",
          isNested ? "px-3 py-2" : "p-3",
        )}
      >
        {/* Root labels ("//ACTION 01") are short and never give way; nested
            titles carry the function name and ellipsize before the chips do. */}
        <div
          className={cn(
            "flex min-w-0 items-center gap-2",
            isNested ? "shrink" : "shrink-0",
          )}
        >
          {headerLabel}
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <ChipCluster abiSource={call.abiSource} hasError={hasError} />
          {call.target && explorerUrl && (
            <DefaultLink
              href={`${explorerUrl}/address/${call.target}`}
              openInNewTab
              className={cn(
                "text-secondary hidden shrink-0 md:inline-flex",
                MONO_LABEL,
              )}
            >
              Contract
            </DefaultLink>
          )}
          {isNested && (
            <CopyRawButton
              textToCopy={call.raw}
              label="copy raw"
              className="hidden shrink-0 sm:inline"
            />
          )}
          {headerRight}
        </div>
      </div>

      <div className="@container flex w-full min-w-0 flex-col gap-3 p-3">
        {hasError && (
          <InlineAlert variant="error" text={call.error ?? "Decode failed."} />
        )}
        {call.warnings.map((warning) => (
          <InlineAlert
            key={warning.code + warning.message}
            variant="warning"
            text={warning.message}
          />
        ))}

        {showDecoded &&
          call.summary &&
          (isNested ? (
            <Row label="summary" nested>
              <p className="text-primary font-inter min-w-0 text-sm leading-5">
                {call.summary}
              </p>
            </Row>
          ) : (
            <SummaryRow summary={call.summary} />
          ))}

        {call.target && (
          <Row label="target" nested={isNested}>
            <span className="flex min-w-0">
              <AddressChip address={call.target} explorerUrl={explorerUrl} />
            </span>
          </Row>
        )}

        {call.functionName && showDecoded && (
          <Row label="function" nested={isNested} align="start">
            <FunctionSignature call={call} nested={isNested} />
          </Row>
        )}

        {showDecoded ? (
          call.params.length > 0 && (
            <Row label="params" nested={isNested} align="start">
              <div
                className={cn(
                  "@container flex min-w-0 flex-1 flex-col gap-2",
                  !isNested && "border-border-contrast border p-3",
                )}
              >
                {call.params.map((param, i) => (
                  <ParamRow
                    key={`${param.name}-${i}`}
                    param={param}
                    chainId={chainId}
                    explorerUrl={explorerUrl}
                    depth={call.depth}
                    uploadedAbis={uploadedAbis}
                    suppressNestedDecode={hasSubcalls}
                  />
                ))}
              </div>
            </Row>
          )
        ) : (
          <RawView
            raw={call.raw}
            selector={call.selector}
            showSelector={call.abiSource === "none"}
          />
        )}

        {call.value !== undefined && (!isNested || call.value > 0n) && (
          <Row label="value" nested={isNested}>
            {call.value > 0n ? (
              <ValueCell
                display={humanizeEtherValue(call.value).text}
                raw={`${call.value.toString()} wei`}
              />
            ) : (
              <p className="text-secondary font-mono text-sm leading-5">
                0 ETH
              </p>
            )}
          </Row>
        )}

        {showDecoded && call.subcalls && call.subcalls.length > 0 && (
          <SubcallList
            subcalls={call.subcalls}
            chainId={chainId}
            explorerUrl={explorerUrl}
            uploadedAbis={uploadedAbis}
          />
        )}
      </div>

      {!isNested && (
        <div className="flex w-full items-center justify-between gap-2 p-3 pt-0">
          <DecodedRawToggle value={view} onValueChange={setView} />
          <CopyRawButton textToCopy={call.raw} />
        </div>
      )}
    </div>
  );
};
