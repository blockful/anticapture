import type { AbiSource } from "@/shared/components/decoder/types";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils/cn";

const ABI_SOURCE: Record<
  Exclude<AbiSource, "none">,
  { label: string; explanation: string; tentative?: boolean }
> = {
  verified: {
    label: "ABI · VERIFIED",
    explanation:
      "Decoded with the target's verified source code from the block explorer.",
  },
  uploaded: {
    label: "ABI · UPLOADED",
    explanation: "Decoded with the ABI you pasted or uploaded on this page.",
  },
  known: {
    label: "ABI · KNOWN",
    explanation:
      "Decoded with a standard interface (ERC-20, Safe, Multicall3, Timelock). The shape is trusted; the target itself was not verified.",
  },
  openchain: {
    label: "ABI · OPENCHAIN",
    explanation:
      "Function name looked up by selector in OpenChain's public signature database. Parameter names are unknown and the target was not verified, so treat the reading as a best guess.",
    tentative: true,
  },
};

/** Square bordered mono chip, per Figma frame 08 (0px radius everywhere). */
const HeaderChip = ({
  children,
  explanation,
  className,
}: {
  children: string;
  explanation: string;
  className?: string;
}) => (
  <Tooltip tooltipContent={explanation} asChild>
    <span
      className={cn(
        "border-border-contrast text-secondary flex h-5 shrink-0 items-center whitespace-nowrap border px-1.5 font-mono text-xs font-medium uppercase leading-4 tracking-wider",
        className,
      )}
    >
      {children}
    </span>
  </Tooltip>
);

/**
 * Header chips: the ABI source in the happy path (frame 08 shows only
 * `ABI · VERIFIED` next to CONTRACT), plus a status chip only when it carries
 * information the source chip cannot (unknown ABI, decode error). Every chip
 * explains itself on hover, and tentative sources (signature-database
 * lookups) get a dashed border so trust is legible before reading.
 */
export const ChipCluster = ({
  abiSource,
  hasError,
}: {
  abiSource: AbiSource;
  hasError: boolean;
}) => (
  <div className="flex shrink-0 items-center gap-1.5">
    {hasError && (
      <HeaderChip
        className="border-border-error text-error"
        explanation="The calldata did not fit the resolved function; the raw hex is still shown below."
      >
        decode error
      </HeaderChip>
    )}
    {!hasError && abiSource === "none" && (
      <HeaderChip
        className="border-border-warning text-warning"
        explanation="No ABI matched this selector. Parameter types were guessed from the raw words; verify against the raw calldata."
      >
        ABI unknown
      </HeaderChip>
    )}
    {abiSource !== "none" && (
      <HeaderChip
        explanation={ABI_SOURCE[abiSource].explanation}
        className={cn(ABI_SOURCE[abiSource].tentative && "border-dashed")}
      >
        {ABI_SOURCE[abiSource].label}
      </HeaderChip>
    )}
  </div>
);
