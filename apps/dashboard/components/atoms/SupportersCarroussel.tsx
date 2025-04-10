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
  const paddedSupporters = supporters.length < 10 
    ? [...supporters, ...supporters, ...supporters, ...supporters] 
    : [...supporters, ...supporters];
    
  const scrollContentRef = useRef<HTMLDivElement>(null);
  
  // Set up the marquee-like animation
  useEffect(() => {
    if (supporters.length <= 1) return;
    
    const scrollElement = scrollContentRef.current;
    if (!scrollElement) return;
    
    let scrollPos = 0;
    const totalWidth = scrollElement.scrollWidth;
    const containerWidth = scrollElement.clientWidth;
    
    // We'll reset when we're halfway through the content
    const resetPoint = totalWidth / 2;
    
    const scroll = () => {
      if (!scrollElement) return;
      
      scrollPos += 1;
      
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
    <div className="relative w-full overflow-hidden border-t border-lightDark bg-dark p-4">
      <div className="flex w-full gap-2">
        <p className="text-md text-gray-400">Latest Supporters</p>
        <TooltipInfo text={"Latest 10 Supporters"} />
      </div>
      
      {/* Left shadow overlay */}
      <div className="absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-dark to-transparent"></div>
      
      <div className="relative pt-2">
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
              <div className="relative w-6 overflow-hidden rounded-full bg-gray-700">
                {supporter.icon ? (
                  <Image 
                    src={supporter.icon} 
                    alt={supporter.name} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-primary/20 h-full w-full" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-200">
                {supporter.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Right shadow overlay */}
      <div className="absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-dark to-transparent"></div>
    </div>
  );
};
