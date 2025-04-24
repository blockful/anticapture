"use client"

interface StageBadgeProps {
  stage: number;
  className?: string;
}

export const StageBadge = ({ stage, className }: StageBadgeProps) => {
  return (
    <div className={`inline-flex rounded-lg bg-dark border border-tangerine px-3 py-1 ${className}`}>
      <span className="text-sm font-medium text-tangerine">STAGE {stage}</span>
    </div>
  );
}; 