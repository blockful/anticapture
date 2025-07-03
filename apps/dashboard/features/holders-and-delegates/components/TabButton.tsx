import { cn } from "@/shared/utils";

interface TabButtonProps<T = string> {
  id: T;
  label: string;
  activeTab: T;
  setActiveTab: (tab: T) => void;
}

export const TabButton = <T extends string>({
  id,
  label,
  activeTab,
  setActiveTab,
}: TabButtonProps<T>) => {
  return (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={cn(
        "cursor-pointer border-1 px-3 py-2 font-mono text-[13px] leading-5 font-medium tracking-[0.78px] uppercase transition-all duration-300",
        activeTab === id
          ? "border-link text-link bg-transparent"
          : "border-[#3F3F46] bg-transparent text-[#A1A1AA] hover:bg-[#27272A]",
      )}
    >
      {label}
    </button>
  );
};
