import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils";
import { TheButton } from "../buttons/TheButton";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  hasNextPage = true,
  hasPreviousPage = true,
}: PaginationProps) {
  return (
    <div className={cn("flex items-center gap-2 px-2", className)}>
      <TheButton
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || !hasPreviousPage}
      >
        <ChevronLeft className="text-primary size-3.5" />
      </TheButton>
      <span className="flex items-center gap-1 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <TheButton
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || !hasNextPage}
      >
        <ChevronRight className="text-primary size-3.5" />
      </TheButton>
    </div>
  );
}
