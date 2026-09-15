import type { AbiSource } from "@/shared/components/decoder/types";
import {
  BadgeStatus,
  type BadgeStatusProps,
} from "@/shared/components/design-system/badges";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { cn } from "@/shared/utils/cn";

const ABI_SOURCE: Record<
  Exclude<AbiSource, "none">,
  {
    label: string;
    explanation: string;
    variant: BadgeStatusProps["variant"];
    tentative?: boolean;
  }
> = {
  verified: {
    label: "ABI Verified",
    variant: "success",
    explanation:
      "Decoded with the target's verified source code from the block explorer.",
  },
  uploaded: {
    label: "ABI Uploaded",
    variant: "secondary",
    explanation: "Decoded with the ABI you pasted or uploaded on this page.",
  },
  known: {
    label: "ABI Known",
    variant: "dimmed",
    explanation:
      "Decoded with a standard interface (ERC-20, Safe, Multicall3, Timelock, Governor). The shape is trusted; the target itself was not verified.",
  },
  openchain: {
    label: "ABI OpenChain",
    variant: "dimmed",
    explanation:
      "Function name looked up by selector in OpenChain's public signature database. Parameter names are unknown and the target was not verified, so treat the reading as a best guess.",
    tentative: true,
  },
};

/** A status badge that explains itself on hover. */
const StatusBadge = ({
  children,
  explanation,
  variant,
  className,
}: {
  children: string;
  explanation: string;
  variant: BadgeStatusProps["variant"];
  className?: string;
}) => (
  <Tooltip tooltipContent={explanation} asChild>
    <span className="flex shrink-0">
      <BadgeStatus variant={variant} className={className}>
        {children}
      </BadgeStatus>
    </span>
  </Tooltip>
);

/**
 * Header badges: the ABI source in the happy path (`ABI Verified` next to the
 * card title), plus a status badge only when it carries information the
 * source badge cannot (no signature matched, decode error). Every badge
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
      <StatusBadge
        variant="error"
        explanation="The calldata did not fit the resolved function; the raw hex is still shown below."
      >
        Decode error
      </StatusBadge>
    )}
    {!hasError && abiSource === "none" && (
      <StatusBadge
        variant="warning"
        explanation="No ABI matched this selector. Parameter types were guessed from the raw words; verify against the raw calldata."
      >
        No signature match
      </StatusBadge>
    )}
    {abiSource !== "none" && (
      <StatusBadge
        variant={ABI_SOURCE[abiSource].variant}
        explanation={ABI_SOURCE[abiSource].explanation}
        className={cn(
          ABI_SOURCE[abiSource].tentative &&
            "border-border-contrast border border-dashed",
        )}
      >
        {ABI_SOURCE[abiSource].label}
      </StatusBadge>
    )}
  </div>
);
