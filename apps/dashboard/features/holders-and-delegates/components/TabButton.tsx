import { Button } from "@/shared/components";
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
    <Button
      key={id}
      onClick={() => setActiveTab(id)}
      variant="outline"
      className={cn(
        "font-mono uppercase",
        activeTab === id && "border-link text-link bg-transparent",
      )}
    >
      {label}
    </Button>
  );
};
