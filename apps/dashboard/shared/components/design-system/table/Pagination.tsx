import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils";
import { TheButton } from "@/shared/components/design-system/buttons/TheButton";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className,
  hasNextPage = true,
  hasPreviousPage = true,
  isLoading = false,
}: PaginationProps) {
  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TheButton
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={isLoading || !hasPreviousPage}
      >
        <ChevronLeft className="text-primary size-3.5" />
      </TheButton>
      <span className="text-secondary bg-surface-contrast flex h-8 items-center gap-1 rounded-md border border-[#3F3F46] px-2 py-1 text-sm font-normal">
        Page {currentPage} of {totalPages}
      </span>
      <TheButton
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={isLoading || !hasNextPage}
      >
        <ChevronRight className="text-primary size-3.5" />
      </TheButton>
    </div>
  );
}
