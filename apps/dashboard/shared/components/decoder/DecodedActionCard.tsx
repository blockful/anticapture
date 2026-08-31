"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { ChipCluster } from "@/shared/components/decoder/ChipCluster";
import { CopyRawButton } from "@/shared/components/decoder/CopyRawButton";
import { AddressChip } from "@/shared/components/decoder/AddressChip";
import { DecodedRawToggle } from "@/shared/components/decoder/DecodedRawToggle";
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

const RowLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-primary min-w-22 shrink-0 font-mono text-sm leading-5">
    {children}
  </p>
);

/**
 * The decoded calldata card: header chip cluster, summary sentence, identity
 * target row, human-first params, nested subcall cards, and the decoded|raw
 * toggle with raw hex one click away in every state.
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

  const headerLabel = headerLeft ?? (
    <p className={cn("text-primary", MONO_LABEL)}>
      {"//"}
      {call.functionName ?? call.selector ?? "call"}
    </p>
  );

  // Frame 08 renders the signature with named args and breathing room:
  // `register (uint256 id, address owner, uint256 duration)`.
  const namedArgs = call.params
    .map((param) => `${param.type} ${param.name}`)
    .join(", ");

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
      <div className="bg-surface-contrast flex w-full flex-wrap items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 items-center gap-2">{headerLabel}</div>
        <div className="flex flex-wrap items-center gap-2">
          <ChipCluster abiSource={call.abiSource} hasError={hasError} />
          {call.target && explorerUrl && (
            <DefaultLink
              href={`${explorerUrl}/address/${call.target}`}
              openInNewTab
              className={cn("text-secondary", MONO_LABEL)}
            >
              Contract
            </DefaultLink>
          )}
          {headerRight}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 p-3">
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

        {showDecoded && call.summary && <SummaryRow summary={call.summary} />}

        {call.target && (
          <div className="flex w-full items-center gap-2">
            <RowLabel>target:</RowLabel>
            <span className="min-w-0">
              <AddressChip address={call.target} explorerUrl={explorerUrl} />
            </span>
          </div>
        )}

        {call.functionName && showDecoded && (
          <div className="flex w-full gap-2">
            <RowLabel>function:</RowLabel>
            <p className="text-secondary min-w-0 break-words font-mono text-sm leading-5">
              <span className="text-link">{call.functionName}</span>{" "}
              {`(${namedArgs})`}
            </p>
          </div>
        )}

        {showDecoded ? (
          call.params.length > 0 && (
            <div className="flex w-full gap-2">
              <RowLabel>params:</RowLabel>
              <div className="border-border-contrast flex min-w-0 flex-1 flex-col gap-2 border p-3">
                {call.params.map((param, i) => (
                  <ParamRow
                    key={`${param.name}-${i}`}
                    param={param}
                    chainId={chainId}
                    explorerUrl={explorerUrl}
                    depth={call.depth}
                    uploadedAbis={uploadedAbis}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          <RawView
            raw={call.raw}
            selector={call.selector}
            showSelector={call.abiSource === "none"}
          />
        )}

        {call.value !== undefined && (
          <div className="flex w-full gap-2">
            <RowLabel>value</RowLabel>
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
          </div>
        )}

        {showDecoded && call.subcalls && call.subcalls.length > 0 && (
          <div className="border-border-contrast ml-2 flex min-w-0 flex-col gap-2 border-l pl-3">
            {call.subcalls.map((subcall) => (
              <DecodedActionCard
                key={subcall.index}
                call={subcall}
                chainId={chainId}
                explorerUrl={explorerUrl}
                uploadedAbis={uploadedAbis}
                headerLeft={
                  <p className={cn("text-primary", MONO_LABEL)}>
                    {"//"}call {String(subcall.index + 1).padStart(2, "0")}
                    {subcall.functionName ? ` · ${subcall.functionName}` : ""}
                  </p>
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex w-full items-center justify-between gap-2 p-3 pt-0">
        <DecodedRawToggle value={view} onValueChange={setView} />
        <CopyRawButton textToCopy={call.raw} />
      </div>
    </div>
  );
};
