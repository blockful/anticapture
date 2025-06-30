import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils";
import { TheButton } from "../buttons/TheButton";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
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
  onPageChange,
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
    } else if (onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (onPageChange) {
      onPageChange(currentPage + 1);
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
      <span className="text-secondary bg-surface-contrast flex items-center gap-1 rounded-md border border-[#3F3F46] px-2 py-1 text-sm font-normal">
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
