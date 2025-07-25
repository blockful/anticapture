import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";

export const ResearchPendingChartBlur = () => {
  return (
    <div className="border-light-dark absolute inset-0 z-10 flex items-center justify-center rounded-lg border bg-black/5 backdrop-blur-[6px]">
      <div className="border-light-dark text-secondary flex items-center gap-2 rounded-full border bg-[#1c1c1c] px-4 py-2 text-sm">
        <CounterClockwiseClockIcon className="text-secondary size-5" />
        RESEARCH PENDING
      </div>
    </div>
  );
};
