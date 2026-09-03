import { cn } from "@/shared/utils/cn";

/** The Level-1 plain-language sentence: "summary:" label + Inter sentence. */
export const SummaryRow = ({
  summary,
  className,
}: {
  summary: string;
  className?: string;
}) => (
  <div className={cn("flex w-full gap-2", className)}>
    <p className="text-primary min-w-22 font-mono text-sm leading-5">
      summary:
    </p>
    <p className="text-primary font-inter min-w-0 text-sm leading-5">
      {summary}
    </p>
  </div>
);
