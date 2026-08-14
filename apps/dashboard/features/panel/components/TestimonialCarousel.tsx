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
    <div className="border-border-default bg-surface-default flex items-center justify-center gap-4 border px-3 py-4">
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
          <Image
            src={testimonial.avatarSrc}
            alt={testimonial.author}
            width={36}
            height={36}
            className="bg-surface-contrast size-9 shrink-0 rounded-full object-cover"
          />
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
