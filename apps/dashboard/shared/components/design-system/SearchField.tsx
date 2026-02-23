import { InputHTMLAttributes } from "react";

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

const SearchField = ({ ...props }: SearchFieldProps) => {
  return (
    <div className="border-border-default bg-surface-default hover:border-border-contrast focus-within:border-border-contrast focus-within:shadow-focus-ring flex items-center gap-2.5 border px-2.5 py-2 transition-all duration-200">
      <input
        type="text"
        {...props}
        className="text-primary placeholder:text-dimmed w-full bg-transparent text-sm font-normal focus:outline-none focus:ring-0 focus:placeholder:opacity-0"
      />
    </div>
  );
};

export default SearchField;
