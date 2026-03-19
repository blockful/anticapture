"use client";

import Lottie from "lottie-react";

import { cn } from "@/shared/utils/cn";
import loadingAnimation from "@/public/loading-animation.json";

export type LogoAnimationSize = "sm" | "md" | "lg";

export type LogoAnimationProps = {
  size?: LogoAnimationSize;
  className?: string;
};

const sizeDimensions: Record<LogoAnimationSize, number> = {
  sm: 200,
  md: 300,
  lg: 400,
};

export const LogoAnimation = ({
  size = "lg",
  className,
}: LogoAnimationProps) => (
  <div className={cn("flex items-center justify-center", className)}>
    <Lottie
      animationData={loadingAnimation}
      height={sizeDimensions[size]}
      width={sizeDimensions[size]}
    />
  </div>
);
