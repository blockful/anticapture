export const DaoOverviewMetricCard = ({
  title,
  text,
  subText,
}: {
  title: string;
  text: string;
  subText: string;
}) => (
  <div className="md:bg-surface-default md:p-3">
    <p className="text-secondary mb-2 font-mono text-xs font-medium uppercase tracking-wider">
      {title}
    </p>
    <p className="text-primary text-sm leading-5">{text}</p>
    <p className="text-secondary text-xs">{subText}</p>
  </div>
);
