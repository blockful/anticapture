import { useEnsData } from "@/shared/hooks/useEnsData";
import { cn } from "@/shared/utils/";
import { Address } from "viem";
import Image from "next/image";

export const SupporterBadge = ({ address }: { address: Address }) => {
  const { data: ensData } = useEnsData(address);
  return (
    <div
      key={`${address}-supporter-badge`}
      className={cn(
        "flex min-w-max items-center gap-2 rounded-full bg-lightDark px-3 py-1.5",
        "transition-all duration-200 hover:bg-gray-700",
      )}
    >
      {ensData?.avatar_url ? (
        <div className="size-4 overflow-hidden rounded-full bg-foreground">
          <Image
            src={ensData.avatar_url}
            alt={ensData?.ens ?? address}
            width={16}
            height={16}
            className="object-cover"
          />
        </div>
      ) : (
        <div className="size-4 rounded-full bg-foreground" />
      )}
      <span className="max-w-[100px] truncate text-sm font-medium text-gray-200">
        {ensData?.ens ? ensData.ens : address}
      </span>
    </div>
  );
};
