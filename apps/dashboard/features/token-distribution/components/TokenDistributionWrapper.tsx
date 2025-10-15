import { cn } from "@/shared/utils";

export const TokenDistributionWrapper = ({
  context,
  children,
}: {
  context: "overview" | "section";
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "border-light-dark sm:bg-surface-default text-primary relative flex h-[300px] w-full flex-col items-center justify-center sm:rounded-lg",
        {
          "-mb-1 h-32": context === "overview",
        },
      )}
    >
      {children}
    </div>
  );
};
