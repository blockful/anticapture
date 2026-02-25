interface ProviderNameCellProps {
  name: string;
  websiteUrl: string;
  proposalUrl?: string;
}

export const ProviderNameCell = ({
  name,
  websiteUrl,
  proposalUrl,
}: ProviderNameCellProps) => {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="bg-surface-contrast border-border-contrast flex size-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold text-white">
        {initials}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-primary truncate text-sm font-medium">
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-link font-mono text-[10px] font-normal uppercase tracking-wider transition-colors"
          >
            WEBSITE
          </a>
          {proposalUrl && (
            <>
              <span className="text-secondary text-[10px]">·</span>
              <a
                href={proposalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-link font-mono text-[10px] font-normal uppercase tracking-wider transition-colors"
              >
                PROPOSAL
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
