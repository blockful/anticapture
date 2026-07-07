"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";

interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Recovery UI for route segment `error.tsx` boundaries. Renders inside the
 * segment's layout, so the surrounding shell (sidebars, header) survives.
 */
export const RouteErrorFallback = ({
  error,
  reset,
}: RouteErrorFallbackProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      data-testid="route-error-fallback"
      className="animate-fade-in flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-5 py-12"
    >
      <h3 className="text-primary text-center font-mono text-2xl font-normal uppercase leading-8">
        [ERROR:something_WENT_WRONG]
      </h3>
      <p className="text-secondary text-center text-base font-normal leading-6">
        This page hit an unexpected error. The rest of the dashboard is
        unaffected.
      </p>
      <Button variant="primary" size="md" onClick={reset}>
        <RotateCcw className="size-4" />
        Try again
      </Button>
    </div>
  );
};
