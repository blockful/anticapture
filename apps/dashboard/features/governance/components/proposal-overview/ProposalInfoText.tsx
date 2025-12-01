import { cn } from "@/shared/utils";

export const ProposalInfoText = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p
      className={cn(
        "text-secondary flex items-center gap-1 font-mono text-[13px] font-medium uppercase leading-[20px] tracking-[0.78px]",
        className,
      )}
      style={{ fontStyle: "normal" }}
    >
      {children}
    </p>
  );
};
