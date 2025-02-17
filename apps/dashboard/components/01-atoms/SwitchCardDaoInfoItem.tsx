import { cn } from "@/lib/client/utils";
import { CircleCheckIcon, CircleNotCheckedIcon } from "./icons";
import { Badge } from "./Badge";

interface SwitchItemProps {
  switched?: boolean;
}

export const SwitchCardDaoInfoItem = (item: SwitchItemProps) => {
  return (
    <Badge
      className={cn("flex h-full w-full bg-opacity-20 lg:w-fit", [
        item.switched ? "bg-[#4ADE80]" : "bg-[#F87171]",
      ])}
    >
      {item.switched ? (
        <CircleCheckIcon className="text-[#4ADE80]" />
      ) : (
        <CircleNotCheckedIcon className="text-[#F87171]" />
      )}
      <p
        className={cn([
          "text-sm font-medium leading-tight",
          item.switched ? "text-[#4ADE80]" : "text-[#F87171]",
        ])}
      >
        {item.switched ? "Yes" : "No"}
      </p>
    </Badge>
  );
};
