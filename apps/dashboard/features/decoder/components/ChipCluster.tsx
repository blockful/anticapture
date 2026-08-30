import { BadgeStatus } from "@/shared/components/design-system/badges";
import type { AbiSource } from "@/features/decoder/types";

const ABI_SOURCE_LABEL: Record<Exclude<AbiSource, "none">, string> = {
  verified: "ABI · VERIFIED",
  uploaded: "ABI · UPLOADED",
  known: "ABI · KNOWN",
  openchain: "ABI · OPENCHAIN",
};

export const DecodeStatusChip = ({
  abiSource,
  hasError,
}: {
  abiSource: AbiSource;
  hasError: boolean;
}) => {
  if (hasError) {
    return (
      <BadgeStatus variant="error" className="font-mono uppercase">
        decode error
      </BadgeStatus>
    );
  }
  if (abiSource === "none") {
    return (
      <BadgeStatus variant="warning" className="font-mono uppercase">
        ABI unknown
      </BadgeStatus>
    );
  }
  return (
    <BadgeStatus variant="success" className="font-mono lowercase">
      decoded ✓
    </BadgeStatus>
  );
};

export const AbiSourceChip = ({ abiSource }: { abiSource: AbiSource }) => {
  if (abiSource === "none") return null;
  return (
    <BadgeStatus variant="outline" className="font-mono">
      {ABI_SOURCE_LABEL[abiSource]}
    </BadgeStatus>
  );
};

/** Header chip pair: decode status + where the ABI came from. */
export const ChipCluster = ({
  abiSource,
  hasError,
}: {
  abiSource: AbiSource;
  hasError: boolean;
}) => (
  <div className="flex items-center gap-1.5">
    <DecodeStatusChip abiSource={abiSource} hasError={hasError} />
    {!hasError && <AbiSourceChip abiSource={abiSource} />}
  </div>
);
