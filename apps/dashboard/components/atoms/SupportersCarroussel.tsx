import { useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/client/utils";
import { TooltipInfo } from "./TooltipInfo";

interface Supporter {
  address: string;
  name: string;
  icon: string;
}

interface SupportersCarrousselProps {
  supporters: Supporter[];
}

// Creates a scrolling carousel that displays supporter badges
export const SupportersCarroussel = ({
  supporters,
}: SupportersCarrousselProps) => {
  // Use enough supporters for a smooth scrolling effect
  let paddedSupporters = supporters;
  while (paddedSupporters.length < 40) {
    paddedSupporters = [...paddedSupporters, ...paddedSupporters];
  }

  const scrollContentRef = useRef<HTMLDivElement>(null);

  // Set up the marquee-like animation
  useEffect(() => {

    const scrollElement = scrollContentRef.current;
    if (!scrollElement) return;

    let scrollPos = 0;
    const totalWidth = scrollElement.scrollWidth;

    // We'll reset when we're halfway through the content
    const resetPoint = totalWidth / 2;

    const scroll = () => {
      if (!scrollElement) return;

      scrollPos += 0.3;

      // If we've scrolled past the first set of supporters,
      // jump back to the beginning to create infinite loop
      if (scrollPos >= resetPoint) {
        scrollPos = 0;
      }

      scrollElement.scrollLeft = scrollPos;
      requestAnimationFrame(scroll);
    };

    const animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [supporters.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-b-lg bg-darkest p-4 sm:border-t sm:border-lightDark sm:bg-dark">
      <div className="flex w-full gap-2">
        <p className="   text-md text-gray-400 z-20">Latest Supporters</p>
        <TooltipInfo text={"Latest 10 Supporters"} />
      </div>

      {/* Left shadow overlay */}
      <div className="absolute left-4 top-0 z-10 h-full w-24 bg-gradient-to-r from-dark to-transparent"></div>

      <div className="relative rounded-lg pt-2">
        <div
          ref={scrollContentRef}
          className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4"
        >
          {paddedSupporters.map((supporter, index) => (
            <div
              key={`${supporter.address}-${index}`}
              className={cn(
                "flex min-w-max items-center gap-2 rounded-full bg-lightDark px-3 py-1.5",
                "transition-all duration-200 hover:bg-gray-700",
              )}
            >
              {supporter.icon ? (
                <Image
                  src={supporter.icon}
                  alt={supporter.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-4 w-4 rounded-full bg-foreground" />
              )}
              <span className="max-w-[100px] truncate text-sm font-medium text-gray-200">
                {!!supporter.name ? supporter.name : supporter.address}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right shadow overlay */}
      <div className="absolute right-4 top-0 z-10 h-full w-24 bg-gradient-to-l from-dark to-transparent"></div>
    </div>
  );
};
