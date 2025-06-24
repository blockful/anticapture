import { Button } from "../../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils";

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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1 || !hasPreviousPage}
        className="text-sm font-medium"
      >
        First
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || !hasPreviousPage}
        className="text-sm font-medium"
      >
        <ChevronLeft className="mr-1 size-4" />
        Previous
      </Button>
      <span className="flex items-center gap-1 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || !hasNextPage}
        className="text-sm font-medium"
      >
        Next
        <ChevronRight className="ml-1 size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages || !hasNextPage}
        className="text-sm font-medium"
      >
        Last
      </Button>
    </div>
  );
}
