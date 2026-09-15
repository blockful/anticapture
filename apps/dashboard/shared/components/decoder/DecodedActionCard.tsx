"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { AddressChip } from "@/shared/components/decoder/AddressChip";
import { ChipCluster } from "@/shared/components/decoder/ChipCluster";
import { CopyButton } from "@/shared/components/decoder/CopyButton";
import { DecodedRawToggle } from "@/shared/components/decoder/DecodedRawToggle";
import { ExpandToggle } from "@/shared/components/decoder/ExpandToggle";
import { layoutParams } from "@/shared/components/decoder/paramLayout";
import { ParamRow } from "@/shared/components/decoder/ParamRow";
import { RawView } from "@/shared/components/decoder/RawView";
import { MONO_LABEL } from "@/shared/components/decoder/styles";
import type {
  DecodedCall,
  DecodedParam,
  ViewMode,
} from "@/shared/components/decoder/types";
import { InlineAlert } from "@/shared/components/design-system/alerts/inline-alert/InlineAlert";
import { BadgeStatus } from "@/shared/components/design-system/badges";
import { DividerDefault } from "@/shared/components/design-system/divider/DividerDefault";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { BulletDivider } from "@/shared/components/design-system/section/bullet-divider/BulletDivider";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { getDetector, type UploadedAbiStore } from "@/shared/services/decoder";
import { humanizeEtherValue } from "@/shared/services/decoder/humanize";
import { cn } from "@/shared/utils/cn";
import { buildCollapsedRowLabel } from "@/shared/utils/collapsedRowLabel";

interface DecodedActionCardProps {
  call: DecodedCall;
  chainId: number;
  explorerUrl?: string;
  /** The proposal tab passes "// Action N"; the tool reads "// Decoded call". */
  headerLeft?: ReactNode;
  /** Extra header actions (copy link, the embedded collapse control). */
  headerRight?: ReactNode;
  defaultView?: ViewMode;
  className?: string;
  /** Forwarded to lazy nested decodes so an uploaded ABI applies there too. */
  uploadedAbis?: UploadedAbiStore;
  /**
   * The proposal tab keeps the Decoded | Raw footer, since it has no input
   * field; the standalone tool shows the raw hex in the field above the card
   * and drops it.
   */
  showRawToggle?: boolean;
  /**
   * Rows only: a subcall row or a lazy bytes decode already drew the line
   * that names this call, so the card brings no border, header or footer.
   */
  embedded?: boolean;
}

/** Signatures with more params than this collapse to `name(…) · N params`. */
const SIGNATURE_INLINE_MAX_PARAMS = 4;

const DELEGATECALL_EXPLANATION =
  "Runs the target's code in the Safe's own storage and balance: its effects apply to the Safe, not to the target contract.";

/**
 * A labelled row: uppercase mono label, content in the base style. Root
 * cards keep the 88px label column from md up and stack the label above the
 * content below it; embedded cards always stack, because every left column
 * a level adds is width the deepest value no longer has.
 */
const Row = ({
  label,
  stacked,
  align = "center",
  children,
}: {
  label: string;
  stacked: boolean;
  align?: "center" | "start";
  children: ReactNode;
}) => (
  <div
    className={cn(
      "flex w-full min-w-0 flex-col gap-1",
      !stacked && "md:flex-row md:gap-2",
      !stacked && (align === "center" ? "md:items-center" : "md:items-start"),
    )}
  >
    <p
      className={cn(
        "shrink-0",
        MONO_LABEL,
        stacked ? "text-secondary" : "text-primary md:w-22 md:leading-5",
      )}
    >
      {label}
    </p>
    {children}
  </div>
);

/**
 * `register (uint256 id, address owner, uint256 duration)` when short enough
 * to read on one line; otherwise `execTransaction (…) · 10 params`, since
 * every argument is already listed in the params box right below.
 */
const FunctionSignature = ({
  call,
  params,
  embedded,
}: {
  call: DecodedCall;
  /** The call's params with the truncation note, if any, already removed. */
  params: DecodedParam[];
  embedded: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  // The ABI decides how many parameters this function has; the render budget
  // decides how many rows exist. A 300-input function must not read as 100.
  const inputCount = call.inputCount ?? params.length;
  const dropped = inputCount - params.length;
  const namedArgs = params
    .map((param) => `${param.type} ${param.name}`)
    .join(", ");
  // Joined rather than appended, so a call whose every input was dropped
  // reads `(+3 more)` and not `(, +3 more)`.
  const argList = [
    namedArgs,
    dropped > 0 ? `+${dropped.toLocaleString("en-US")} more` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const inline =
    expanded || (!embedded && inputCount <= SIGNATURE_INLINE_MAX_PARAMS);
  const collapsible = inputCount > SIGNATURE_INLINE_MAX_PARAMS || embedded;

  return (
    <p className="text-secondary min-w-0 break-words text-sm leading-5">
      <span className="text-link font-medium">{call.functionName}</span>{" "}
      {inline ? (
        `(${argList})`
      ) : (
        <>
          {"(…)"}
          <span className="text-secondary">
            {" "}
            · {inputCount.toLocaleString("en-US")} params{" "}
          </span>
        </>
      )}
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="text-secondary hover:text-primary cursor-pointer text-xs leading-4 underline decoration-dotted underline-offset-4"
        >
          {inline ? "hide" : "show all"}
        </button>
      )}
    </p>
  );
};

const ElevatedPermissionBadge = () => (
  <Tooltip tooltipContent={DELEGATECALL_EXPLANATION} asChild>
    <span className="flex shrink-0">
      <BadgeStatus variant="warning">Elevated permission</BadgeStatus>
    </span>
  </Tooltip>
);

/**
 * How the call is invoked: the Safe `operation` byte (`1 · delegatecall`)
 * or, for a child of a batch, the mode its parent used. A delegatecall gets
 * the elevated-permission badge, because the callee then acts as the Safe.
 */
const OperationValue = ({
  code,
  operation,
}: {
  code: string;
  operation: "call" | "delegatecall" | "unknown";
}) => (
  <div className="flex min-w-0 flex-wrap items-center gap-2">
    <span className="text-primary text-sm leading-5">
      {code} · {operation === "unknown" ? "unknown operation" : operation}
    </span>
    {operation === "delegatecall" && <ElevatedPermissionBadge />}
  </div>
);

const operationName = (code: string): "call" | "delegatecall" | "unknown" =>
  code === "0" ? "call" : code === "1" ? "delegatecall" : "unknown";

/** `7 actions` / `4 calls`: the wrapper's own word for what it carries. */
const subcallCountLabel = (call: DecodedCall, count: number): string => {
  const detector = call.selector === null ? null : getDetector(call.selector);
  const nouns = detector?.noun ?? { one: "call", many: "calls" };
  return `${count.toLocaleString("en-US")} ${count === 1 ? nouns.one : nouns.many}`;
};

/**
 * Subcalls a wrapper unpacked, one line each: chevron, target chip, the
 * call's sentence, its signature. A lone subcall opens by default; several
 * stay collapsed, so a Timelock batch of eight Safe transactions reads as a
 * list before it reads as eight full cards. Opening a row renders the
 * call's rows one rail deeper, under the line that names it.
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
    <div className="divide-border-default flex min-w-0 flex-col divide-y">
      {subcalls.map((subcall) => {
        const isOpen = open.has(subcall.index);
        const number = subcall.index + 1;
        const label = buildCollapsedRowLabel(
          subcall,
          subcall.raw,
          subcall.value,
        );
        // A plain ETH transfer has no selector to match, so "no signature
        // match" would be a false alarm on it.
        const undecoded =
          subcall.error !== undefined ||
          (subcall.abiSource === "none" && subcall.selector !== null);
        return (
          <div key={subcall.index} className="flex min-w-0 flex-col py-1.5">
            {/* On a phone the sentence drops under the chip instead of being
                squeezed into whatever the badges leave. */}
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 md:flex-nowrap">
              <ExpandToggle
                expanded={isOpen}
                onToggle={() => toggle(subcall.index)}
                label={`${isOpen ? "Collapse" : "Expand"} call ${number}`}
              />
              {subcall.target && (
                <span className="flex min-w-0 max-w-[45%] shrink-0">
                  <AddressChip
                    address={subcall.target}
                    chainId={chainId}
                    explorerUrl={explorerUrl}
                    compact
                  />
                </span>
              )}
              <button
                type="button"
                onClick={() => toggle(subcall.index)}
                className="text-primary line-clamp-2 min-w-0 flex-1 cursor-pointer text-left text-sm leading-5 md:line-clamp-1"
              >
                {label.label}
              </button>
              {/* What the batch does not promise about this child has to
                  survive collapsing: the open rows state each in full, but
                  the line above them must say it too. */}
              {subcall.operation === "delegatecall" && (
                <ElevatedPermissionBadge />
              )}
              {subcall.mayFail && (
                <Tooltip
                  tooltipContent="The batch allows this call to fail without reverting the other calls."
                  asChild
                >
                  <span className="flex shrink-0">
                    <BadgeStatus variant="dimmed">May fail</BadgeStatus>
                  </span>
                </Tooltip>
              )}
              {undecoded && (
                <ChipCluster
                  abiSource={subcall.abiSource}
                  hasError={subcall.error !== undefined}
                />
              )}
              {label.signature && (
                <span className="text-secondary hidden min-w-0 shrink-[4] truncate text-right text-sm leading-5 md:block">
                  {label.signature}
                </span>
              )}
            </div>
            {isOpen && (
              <div className="border-border-contrast ml-2.5 mt-2 min-w-0 border-l pl-3">
                <DecodedActionCard
                  call={subcall}
                  chainId={chainId}
                  explorerUrl={explorerUrl}
                  uploadedAbis={uploadedAbis}
                  embedded
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * The decoded calldata card: header with the ABI-source badge, summary
 * sentence, identity target row, human-first params, the Safe operation with
 * its permission badge, nested subcall rows, and (on the proposal tab) the
 * Decoded | Raw footer with raw hex one click away.
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
  showRawToggle = true,
  embedded = false,
}: DecodedActionCardProps) => {
  const [view, setView] = useState<ViewMode>(defaultView);
  const [executionOpen, setExecutionOpen] = useState(false);

  // The decoder appends a "N more parameters not shown" note when one call
  // declares more inputs than the render budget holds. It is a note about the
  // omitted tail, not a parameter, so it is listed apart from the rows.
  const params = call.params.filter((param) => !param.isTruncationNote);
  const paramsNote = call.params.find((param) => param.isTruncationNote);
  const layout = layoutParams(call, params);

  const hasError = call.error !== undefined;
  const rawToggle = !embedded && showRawToggle;
  const showDecoded = (!rawToggle || view === "decoded") && !hasError;
  const subcalls = call.subcalls ?? [];
  const subcallCount = call.subcallCount ?? subcalls.length;
  const hasSubcalls = subcalls.length > 0;
  const unpackedNote = hasSubcalls
    ? `${subcallCountLabel(call, subcallCount)}, unpacked below`
    : undefined;

  const operationCode =
    layout.operation?.value ??
    (call.operation === "delegatecall" ? "1" : undefined);

  const hasParams = layout.primary.length > 0 || layout.secondary || paramsNote;

  const renderParam = (param: DecodedParam, index: number) => (
    <ParamRow
      key={`${param.name}-${index}`}
      param={param}
      chainId={chainId}
      explorerUrl={explorerUrl}
      depth={call.depth}
      uploadedAbis={uploadedAbis}
      unpackedNote={param === layout.payload ? unpackedNote : undefined}
    />
  );

  const contractLink = call.target && explorerUrl && (
    <DefaultLink
      href={`${explorerUrl}/address/${call.target}`}
      openInNewTab
      size="sm"
      className="shrink-0"
    >
      Contract
      <ExternalLink className="size-3" aria-hidden="true" />
    </DefaultLink>
  );

  const body = (
    <div
      className={cn(
        "@container flex w-full min-w-0 flex-col",
        embedded ? "gap-3" : "gap-4 p-3",
      )}
    >
      {/* An embedded card has no header bar, but how the call was decoded,
          where its contract lives and its raw bytes must not vanish with it. */}
      {embedded && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <ChipCluster abiSource={call.abiSource} hasError={hasError} />
          {contractLink}
          <CopyButton
            textToCopy={call.raw}
            label="Copy raw"
            className="-my-1 ml-auto"
          />
        </div>
      )}
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

      {showDecoded && call.summary && (
        <Row label="summary" stacked={embedded} align="start">
          <p className="text-primary min-w-0 text-sm leading-5">
            {call.summary}
          </p>
        </Row>
      )}

      {call.target && !embedded && (
        <Row label="target" stacked={embedded}>
          <span className="flex min-w-0">
            <AddressChip
              address={call.target}
              chainId={chainId}
              explorerUrl={explorerUrl}
            />
          </span>
        </Row>
      )}

      {call.functionName && showDecoded && (
        <Row label="function" stacked={embedded} align="start">
          <FunctionSignature call={call} params={params} embedded={embedded} />
        </Row>
      )}

      {showDecoded ? (
        // The note has to show precisely when the budget dropped every
        // input, or the card would claim the call takes no arguments.
        hasParams && (
          <Row label="params" stacked={embedded} align="start">
            <div
              className={cn(
                "@container flex min-w-0 flex-1 flex-col gap-2",
                !embedded && "border-border-contrast border p-3",
              )}
            >
              {layout.primary.map(renderParam)}
              {layout.secondary && (
                <div className="flex min-w-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setExecutionOpen((current) => !current)}
                    aria-expanded={executionOpen}
                    className="text-secondary hover:text-primary flex w-fit cursor-pointer items-center gap-2 text-left text-sm leading-5 transition-colors duration-[120ms] ease-[var(--ease-decoder)]"
                  >
                    <ChevronRight
                      aria-hidden="true"
                      className={cn(
                        "size-3.5 shrink-0 transition-transform duration-[120ms] ease-[var(--ease-decoder)]",
                        executionOpen && "rotate-90",
                      )}
                    />
                    {layout.secondary.label}
                  </button>
                  {executionOpen && layout.secondary.params.map(renderParam)}
                </div>
              )}
              {paramsNote && (
                <p className="text-secondary w-fit text-sm leading-5">
                  {paramsNote.value}
                </p>
              )}
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

      {showDecoded && operationCode !== undefined && (
        <Row label="operation" stacked={embedded}>
          <OperationValue
            code={operationCode}
            operation={operationName(operationCode)}
          />
        </Row>
      )}

      {call.value !== undefined && (!embedded || call.value > 0n) && (
        <Row label="value" stacked={embedded}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-primary text-sm leading-5">
              {call.value > 0n ? humanizeEtherValue(call.value).text : "0 ETH"}
            </span>
            {call.value > 0n && (
              <>
                <BulletDivider className="shrink-0" />
                <span className="text-secondary min-w-0 truncate text-sm leading-5">
                  {call.value.toString()} wei
                </span>
              </>
            )}
          </div>
        </Row>
      )}

      {showDecoded &&
        hasSubcalls &&
        (embedded ? (
          <div className="flex min-w-0 flex-col gap-1">
            <p className={cn("text-secondary", MONO_LABEL)}>
              {subcallCountLabel(call, subcallCount)}
            </p>
            <SubcallList
              subcalls={subcalls}
              chainId={chainId}
              explorerUrl={explorerUrl}
              uploadedAbis={uploadedAbis}
            />
          </div>
        ) : (
          <Row label="nested" stacked={false} align="start">
            <div className="border-border-default flex min-w-0 flex-1 flex-col border px-3 py-1">
              <SubcallList
                subcalls={subcalls}
                chainId={chainId}
                explorerUrl={explorerUrl}
                uploadedAbis={uploadedAbis}
              />
            </div>
          </Row>
        ))}
    </div>
  );

  if (embedded) return <div className={className}>{body}</div>;

  const headerLabel = headerLeft ?? (
    <p className={cn("text-primary shrink-0", MONO_LABEL)}>
      {"//"}decoded call
    </p>
  );

  return (
    <div
      className={cn(
        "border-border-default bg-surface-default flex w-full min-w-0 flex-col border",
        className,
      )}
    >
      <div className="bg-surface-contrast border-border-default flex w-full flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {headerLabel}
          <ChipCluster abiSource={call.abiSource} hasError={hasError} />
        </div>
        <div className="flex min-w-0 items-center gap-2 md:ml-auto">
          {contractLink}
          {headerRight && (
            <>
              {contractLink && <DividerDefault isVertical className="h-4" />}
              {headerRight}
            </>
          )}
        </div>
      </div>

      {body}

      {rawToggle && (
        <div className="flex w-full items-center justify-between gap-2 p-3 pt-0">
          <DecodedRawToggle value={view} onValueChange={setView} />
          <CopyButton textToCopy={call.raw} label="Copy raw" />
        </div>
      )}
    </div>
  );
};
