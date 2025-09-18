export const ProposalInfoText = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <p
      className="text-secondary flex items-center gap-1 font-mono text-[13px] font-medium uppercase leading-[20px] tracking-[0.78px]"
      style={{ fontStyle: "normal" }}
    >
      {children}
    </p>
  );
};
