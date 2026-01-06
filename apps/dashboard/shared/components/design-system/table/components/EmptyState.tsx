import { AlienIcon } from "@/public/icons/AlienIcon";

export const EmptyState = ({
  title = "Oops — we ran into a hiccup fetching the data",
  description = "Things are stabilizing, and our team is on it!",
  icon,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="text-secondary/70 flex flex-col items-center gap-2 p-8 text-center text-sm">
      {icon || <AlienIcon />}

      <span className="text-primary font-mono text-xs font-medium uppercase leading-none tracking-wider">
        {title}
      </span>
      <span className="text-secondary text-sm leading-none">{description}</span>
    </div>
  );
};
