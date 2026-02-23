import { cn } from "@/shared/utils";

export const BulletDivider = ({ className }: { className?: string }) => {
  return (
    <div className={cn("bg-surface-hover size-1 rounded-full", className)} />
  );
};
