import { useScreenSize } from "@/lib/hooks/useScreenSize";
import { Clock2 } from "lucide-react";

export const BadgeInAnalysis = () => {
  const { isMobile } = useScreenSize();
  return isMobile ? (
    <div className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-1.5 py-0.5 text-foreground">
      <Clock2 className="h-4 w-4" />
      In analysis
    </div>
  ) : (
    <div className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-1.5 py-0.5 text-foreground">
      <Clock2 className="h-4 w-4" />
      Analysis in progress
    </div>
  );
};
