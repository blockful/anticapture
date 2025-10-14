import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils";
import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
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
      <IconButton
        variant="outline"
        onClick={handlePrevious}
        disabled={isLoading || !hasPreviousPage}
        icon={ChevronLeft}
      />
      <span className="text-secondary bg-surface-contrast flex h-8 items-center gap-1 rounded-md border border-[#3F3F46] px-2 py-1 text-sm font-normal">
        Page {currentPage} {totalPages && `of ${totalPages}`}
      </span>
      <IconButton
        variant="outline"
        onClick={handleNext}
        disabled={isLoading || !hasNextPage}
        icon={ChevronRight}
      />
    </div>
  );
}
