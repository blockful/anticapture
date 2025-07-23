import { cn } from "@/shared/utils";

interface ActivityIndicatorProps {
  className?: string;
}

export const ActivityIndicator = ({ className }: ActivityIndicatorProps) => (
  <div className={cn("flex items-center justify-center", className)}>
    <div className="border-warning size-4 animate-spin rounded-full border-2 border-t-transparent" />
  </div>
); 