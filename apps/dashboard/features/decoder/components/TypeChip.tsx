import { cn } from "@/shared/utils/cn";

/**
 * Small bordered solidity-type badge ("uint256", "address", "bytes32").
 * Rendered in a fixed-width column by ParamRow so values align vertically.
 */
export const TypeChip = ({
  type,
  className,
}: {
  type: string;
  className?: string;
}) => (
  <span
    className={cn(
      "border-border-contrast text-dimmed w-fit whitespace-nowrap border px-1 font-mono text-xs leading-4",
      className,
    )}
  >
    {type}
  </span>
);
