import { Search } from "lucide-react";
import { InputHTMLAttributes } from "react";

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

const SearchField = ({ ...props }: SearchFieldProps) => {
  return (
    <div className="border-border-default bg-surface-default hover:border-border-contrast focus-within:border-border-contrast flex items-center gap-2.5 rounded-md border px-2.5 py-2 transition-all duration-200 focus-within:shadow-[0_0_0_2px_rgba(82,82,91,0.30)]">
      <Search className="text-secondary h-4 w-4 flex-shrink-0" />
      <input
        type="text"
        {...props}
        className="text-primary placeholder:text-dimmed w-full bg-transparent text-sm font-normal focus:outline-none focus:ring-0 focus:placeholder:opacity-0"
      />
    </div>
  );
};

export default SearchField;
