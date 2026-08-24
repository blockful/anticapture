"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { TESTIMONIALS } from "@/features/panel/constants/track-record";
import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";

export const TestimonialCarousel = () => {
  const [index, setIndex] = useState(0);

  const testimonial = TESTIMONIALS[index];
  const hasMultiple = TESTIMONIALS.length > 1;

  if (!testimonial) return null;

  const goTo = (offset: number) =>
    setIndex(
      (current) =>
        (current + offset + TESTIMONIALS.length) % TESTIMONIALS.length,
    );

  return (
    <div
      className="border-border-default bg-surface-default flex items-center justify-center gap-4 border px-3 py-4"
      role="group"
      aria-roledescription="carousel"
      aria-label="Testimonials"
    >
      <IconButton
        icon={ChevronLeft}
        variant="ghost"
        size="md"
        className="size-9"
        iconClassName="size-4"
        aria-label="Previous testimonial"
        disabled={!hasMultiple}
        onClick={() => goTo(-1)}
      />

      {/*
        The arrows keep focus while the quote underneath them is swapped, so
        without a live region a screen-reader user hears nothing and the buttons
        read as dead. `aria-atomic` makes the quote and its author announce as
        one testimonial rather than as two unrelated text changes.
      */}
      <div
        className="flex min-w-0 flex-1"
        aria-live="polite"
        aria-atomic="true"
      >
        <Link
          href={testimonial.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center gap-4"
        >
          <p className="text-primary text-center text-base font-normal leading-6">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <Image
              src={testimonial.avatarSrc}
              /* Decorative: the author's name renders right next to it, and
               * the atomic live region would announce the name twice on
               * every slide change if the portrait repeated it. */
              alt=""
              width={36}
              height={36}
              className="bg-surface-contrast size-9 shrink-0 rounded-full object-cover"
            />
            <div className="flex flex-col justify-center">
              <span className="text-primary text-sm font-medium leading-5">
                {testimonial.author}
              </span>
              <span className="text-secondary text-sm font-normal leading-5">
                {testimonial.handle}
              </span>
            </div>
          </div>
        </Link>
      </div>

      <IconButton
        icon={ChevronRight}
        variant="ghost"
        size="md"
        className="size-9"
        iconClassName="size-4"
        aria-label="Next testimonial"
        disabled={!hasMultiple}
        onClick={() => goTo(1)}
      />
    </div>
  );
};
