export const ProposalBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-surface-opacity-brand text-link font-inter flex rounded-full px-[6px] py-[2px] text-xs">
      {children}
    </div>
  );
};
