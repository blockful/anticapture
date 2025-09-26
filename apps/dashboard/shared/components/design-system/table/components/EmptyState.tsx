import { AlienIcon } from "@/public/icons/AlienIcon";

export const EmptyState = () => {
  return (
    <div className="text-secondary/70 flex flex-col items-center gap-2 p-8 text-center text-sm">
      <AlienIcon />

      <span className="text-primary text-xs font-medium uppercase tracking-wider">
        Oops — we ran into a hiccup fetching the data
      </span>
      <span className="text-secondary text-xs">
        Things are stabilizing, and our team is on it!
      </span>
    </div>
  );
};
