"use client";

import { useId } from "react";
import type { SVGProps } from "react";

import { cn } from "@/shared/utils/cn";

/** EFP app logo mark (gradient tile + glyph) */
export const EfpIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => {
  const gradientId = `efp-app-logo-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 512 512"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(className)}
      {...props}
    >
      <rect width="512" height="512" rx="40" fill={`url(#${gradientId})`} />
      <path
        d="M167.68 258.56L255.36 112.64L342.4 258.56L255.36 311.68L167.68 258.56Z"
        fill="#333333"
      />
      <path
        d="M255.36 327.68L167.68 274.56L255.36 398.08L342.4 274.56L255.36 327.68Z"
        fill="#333333"
      />
      <path
        d="M367.36 341.76H342.4V378.88H307.84V401.92H342.4V440.32H367.36V401.92H401.28V378.88H367.36V341.76Z"
        fill="#333333"
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="256"
          y1="256"
          x2="512"
          y2="512"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFE067" />
          <stop offset="1" stopColor="#FFF7D9" />
        </linearGradient>
      </defs>
    </svg>
  );
};
