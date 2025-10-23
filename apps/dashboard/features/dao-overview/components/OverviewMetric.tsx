export const OverviewMetric = ({
  label,
  color,
}: {
  label: string;
  color: string;
}) => {
  return (
    <div className="flex h-full w-min flex-col justify-between rounded-sm xl:flex-row xl:items-center xl:gap-2">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 xl:items-start xl:justify-start">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="rounded-xs size-2 shrink-0"
            style={{ backgroundColor: color }}
          />
          <p className="text-primary truncate text-sm font-normal">{label}</p>
        </div>
      </div>
    </div>
  );
};
