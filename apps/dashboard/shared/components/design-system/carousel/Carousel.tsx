"use client";

import { useRef, useState } from "react";

export const Carousel = ({ slides }: { slides: React.ReactNode[] }) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;

    if (deltaX > threshold && current > 0) {
      setCurrent((prev) => prev - 1);
    } else if (deltaX < -threshold && current < slides.length - 1) {
      setCurrent((prev) => prev + 1);
    }

    touchStartX.current = null;
  };

  return (
    <div className="w-full max-w-xl overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) => (
          <div key={index} className="w-full shrink-0">
            {slide}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-4 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 w-6 transition-all duration-300 ${
              current === index ? "bg-link" : "bg-surface-contrast"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
