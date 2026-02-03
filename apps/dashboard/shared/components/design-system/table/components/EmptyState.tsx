import { AlienIcon } from "@/public/icons/AlienIcon";
import { cn } from "@/shared/utils";

export const EmptyState = ({
  title = "Oops — we ran into a hiccup fetching the data",
  description = "Things are stabilizing, and our team is on it!",
  icon,
  fillHeight = false,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  fillHeight?: boolean;
}) => {
  return (
    <div
      className={cn(
        "text-secondary/70 flex flex-col items-center gap-2 p-8 text-center text-sm",
        fillHeight && "h-[calc(100vh-300px)] justify-center",
      )}
    >
      {icon || <AlienIcon />}

      <span className="text-primary font-mono text-xs font-medium uppercase leading-none tracking-wider">
        {title}
      </span>
      <span className="text-secondary text-sm leading-none">{description}</span>
    </div>
  );
};
