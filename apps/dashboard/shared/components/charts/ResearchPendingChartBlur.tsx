import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";

export const ResearchPendingChartBlur = () => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-light-dark bg-black/5 backdrop-blur-[6px]">
      <div className="flex items-center gap-2 rounded-full border border-light-dark bg-[#1c1c1c] px-4 py-2 text-sm text-foreground">
        <CounterClockwiseClockIcon className="size-5 text-foreground" />
        RESEARCH PENDING
      </div>
    </div>
  );
};
