import { TooltipInfo } from "@/shared/components/tooltips/TooltipInfo";
import { Address } from "viem";
import {
  SupporterBadge,
  LoadingSupporterBadge,
} from "@/shared/components/badges/SupporterBadge";

interface SupportersCarrousselProps {
  supporters: Address[];
  isLoading: boolean;
}

// Creates a scrolling carousel that displays supporter badges
export const SupportersCarroussel = ({
  supporters,
  isLoading,
}: SupportersCarrousselProps) => {
  return (
    <div className="border-light-dark bg-surface-background sm:bg-surface-default relative w-full overflow-hidden border-b p-4 sm:rounded-b-lg sm:border-t sm:border-b-0">
      <div className="flex w-full gap-2">
        <p className="text-md z-20 text-gray-400">Latest Supporters</p>
        <TooltipInfo text={"Latest 10 Supporters"} />
      </div>

      {/* Left shadow overlay */}
      <div className="sm:from-dark absolute top-0 left-3 z-10 h-full w-24 bg-linear-to-r from-black to-transparent md:from-[#18181B]" />

      <div className="relative overflow-hidden rounded-lg pt-2">
        <div className="animate-scroll-left flex items-center gap-2">
          {isLoading ? (
            <>
              {Array.from({ length: 40 }).map((_, index) => (
                <LoadingSupporterBadge key={`loading-supporter-${index}`} />
              ))}
            </>
          ) : (
            supporters.map((supporter, index) => (
              <SupporterBadge
                key={`${supporter}-${index}`}
                address={supporter}
              />
            ))
          )}
        </div>
      </div>

      {/* Right shadow overlay */}
      <div className="sm:from-dark absolute top-0 right-4 z-10 h-full w-24 bg-linear-to-l from-black to-transparent md:from-[#18181B]" />
    </div>
  );
};
