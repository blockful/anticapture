import type { AbiSource } from "@/shared/components/decoder/types";
import { cn } from "@/shared/utils/cn";

const ABI_SOURCE_LABEL: Record<Exclude<AbiSource, "none">, string> = {
  verified: "ABI · VERIFIED",
  uploaded: "ABI · UPLOADED",
  known: "ABI · KNOWN",
  openchain: "ABI · OPENCHAIN",
};

/** Square bordered mono chip, per Figma frame 08 (0px radius everywhere). */
const HeaderChip = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => (
  <span
    className={cn(
      "border-border-contrast text-secondary flex h-5 items-center border px-1.5 font-mono text-xs font-medium uppercase leading-4 tracking-wider",
      className,
    )}
  >
    {children}
  </span>
);

/**
 * Header chips: the ABI source in the happy path (frame 08 shows only
 * `ABI · VERIFIED` next to CONTRACT), plus a status chip only when it carries
 * information the source chip cannot (unknown ABI, decode error).
 */
export const ChipCluster = ({
  abiSource,
  hasError,
}: {
  abiSource: AbiSource;
  hasError: boolean;
}) => (
  <div className="flex items-center gap-1.5">
    {hasError && (
      <HeaderChip className="border-border-error text-error">
        decode error
      </HeaderChip>
    )}
    {!hasError && abiSource === "none" && (
      <HeaderChip className="border-border-warning text-warning">
        ABI unknown
      </HeaderChip>
    )}
    {abiSource !== "none" && (
      <HeaderChip>{ABI_SOURCE_LABEL[abiSource]}</HeaderChip>
    )}
  </div>
);
