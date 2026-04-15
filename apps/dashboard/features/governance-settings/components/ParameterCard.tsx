import { SkeletonRow } from "@/shared/components";

interface ParameterCardProps {
  label: string;
  value: string;
  description: string;
  isLoading?: boolean;
}

export const ParameterCard = ({
  label,
  value,
  description,
  isLoading = false,
}: ParameterCardProps) => (
  <div className="bg-surface-default flex flex-col gap-1 rounded-lg p-3">
    <p className="text-secondary text-xs font-medium">{label}</p>
    {isLoading ? (
      <SkeletonRow
        parentClassName="flex animate-pulse w-full"
        className="bg-surface-hover h-5 w-32"
      />
    ) : (
      <p className="text-primary text-sm font-medium">{value}</p>
    )}
    {isLoading ? (
      <SkeletonRow
        parentClassName="flex animate-pulse w-full"
        className="bg-surface-hover h-4 w-48"
      />
    ) : (
      <p className="text-secondary text-xs">{description}</p>
    )}
  </div>
);
