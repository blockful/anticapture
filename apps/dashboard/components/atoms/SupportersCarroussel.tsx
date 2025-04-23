"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/client/utils";
import { TooltipInfo } from "@/components/atoms/TooltipInfo";
import { Address } from "viem";
import { SupporterBadge } from "./SupporterBadge";

interface SupportersCarrousselProps {
  supporters: Address[];
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
    <div className="relative w-full overflow-hidden sm:rounded-b-lg bg-darkest p-4 sm:border-t border-b sm:border-b-0 border-lightDark sm:bg-dark">
      <div className="flex w-full gap-2">
        <p className="text-md z-20 text-gray-400">Latest Supporters</p>
        <TooltipInfo text={"Latest 10 Supporters"} />
      </div>

      {/* Left shadow overlay */}
      <div className="absolute left-3 top-0 z-10 h-full w-24 bg-gradient-to-r from-darkest to-transparent sm:from-dark" />

      <div className="relative rounded-lg pt-2">
        <div
          ref={scrollContentRef}
          className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4"
        >
          {paddedSupporters.map((supporter, index) => (
            <SupporterBadge key={`${supporter}-${index}`} address={supporter} />
          ))}
        </div>
      </div>

      {/* Right shadow overlay */}
      <div className="absolute right-4 top-0 z-10 h-full w-24 bg-gradient-to-l from-darkest to-transparent sm:from-dark" />
    </div>
  );
};
