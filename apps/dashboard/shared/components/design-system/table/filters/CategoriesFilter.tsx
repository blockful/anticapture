import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { ButtonFilter } from "@/shared/components/design-system/table/ButtonFilter";
import { Button } from "@/shared/components/design-system/buttons/button/Button";

export interface FilterOption {
  value: string;
  label: string;
}

interface CategoriesFilterProps {
  options: FilterOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CategoriesFilter = ({
  options,
  selectedValue,
  onValueChange,
  className,
}: CategoriesFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  const hasFilters =
    selectedValue !== "" && selectedValue !== options[0]?.value;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ButtonFilter
          onClick={() => setIsOpen(!isOpen)}
          isOpen={isOpen}
          hasFilters={hasFilters}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        avoidCollisions={true}
        className={cn(
          "border-border-contrast bg-surface-contrast z-50 w-[138px] whitespace-nowrap border p-0 shadow-lg",
        )}
      >
        <div className="flex flex-col">
          {options.map((option, index) => (
            <Button
              variant="ghost"
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={cn(
                "items-center justify-between px-3 text-left",
                index === 0 && "border-border-contrast border-0 border-b",
              )}
            >
              <span className="wrap-normal">{option.label}</span>
              {selectedValue === option.value && (
                <Check className="text-primary size-4" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
