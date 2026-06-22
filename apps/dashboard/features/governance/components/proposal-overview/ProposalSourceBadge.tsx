import { BadgeStatus } from "@/shared/components/design-system/badges";

export type ProposalSource = "onchain" | "offchain";

const SOURCE_LABELS: Record<ProposalSource, string> = {
  onchain: "Governor",
  offchain: "Snapshot",
};

export const ProposalSourceBadge = ({
  source,
  className,
}: {
  source: ProposalSource;
  className?: string;
}) => {
  return (
    <BadgeStatus variant="outline" className={className}>
      {SOURCE_LABELS[source]}
    </BadgeStatus>
  );
};
