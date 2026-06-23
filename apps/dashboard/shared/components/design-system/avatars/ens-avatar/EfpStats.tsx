import Link from "next/link";

import { cn } from "@/shared/utils/cn";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

export interface EfpStatsData {
  followers: number;
  following: number;
  profileUrl?: string;
}

interface EfpStatsProps extends EfpStatsData {
  className?: string;
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <span className="flex items-center gap-1">
    <span className="text-secondary">{label}</span>
    <span className="text-primary font-medium">
      {formatNumberUserReadable(value, 1)}
    </span>
  </span>
);

export const EfpStats = ({
  followers,
  following,
  profileUrl,
  className,
}: EfpStatsProps) => {
  const content = (
    <div
      className={cn(
        "flex items-center gap-2 text-[11px] leading-none",
        className,
      )}
    >
      <Stat label="Following" value={following} />
      <span className="text-dimmed">|</span>
      <Stat label="Followers" value={followers} />
    </div>
  );

  if (!profileUrl) {
    return content;
  }

  return (
    <Link
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-fit transition-opacity hover:opacity-80"
    >
      {content}
    </Link>
  );
};
