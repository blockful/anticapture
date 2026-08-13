"use client";

import { ChevronLeft, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import { mockedTestimonials } from "@/shared/constants/mocked-data/mocked-track-record";

export const TestimonialCarousel = () => {
  const [index, setIndex] = useState(0);

  const testimonial = mockedTestimonials[index];
  const hasMultiple = mockedTestimonials.length > 1;

  if (!testimonial) return null;

  const goTo = (offset: number) =>
    setIndex(
      (current) =>
        (current + offset + mockedTestimonials.length) %
        mockedTestimonials.length,
    );

  return (
    <div className="border-border-default bg-surface-default flex items-center justify-center gap-4 px-3 py-4">
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
          <span className="bg-surface-contrast text-secondary flex size-9 shrink-0 items-center justify-center rounded-full">
            <User className="size-4" />
          </span>
          <div className="flex flex-col justify-center">
            <span className="text-primary text-sm font-medium leading-5">
              {testimonial.author}
            </span>
            <span className="text-secondary text-sm font-normal leading-5">
              {testimonial.role}
            </span>
          </div>
        </div>
      </Link>

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
