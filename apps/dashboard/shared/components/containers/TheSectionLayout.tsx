"use client";

import { getDateRange } from "@/shared/utils";
import { useScreenSize } from "@/shared/hooks";
import { ReactNode, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { CardDescription, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils";
import { Info } from "lucide-react";

interface TheSectionLayoutProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  infoText?: string;
  days?: string;
  switchDate?: ReactNode;
  isSwitchDateLinear?: boolean;
  riskLevel?: ReactNode;
  children: ReactNode;
  anchorId: string;
  className?: string;
  subHeader?: ReactNode;
  leftContent?: ReactNode;
}

export const TheSectionLayout = ({
  icon,
  title,
  subtitle,
  description,
  infoText,
  days,
  switchDate,
  isSwitchDateLinear = false,
  riskLevel,
  children,
  anchorId,
  className,
  subHeader,
  leftContent,
}: TheSectionLayoutProps) => {
  const { isMobile, isDesktop } = useScreenSize();
  const { ref, inView } = useInView({
    threshold: isMobile ? 0.3 : isDesktop ? 0.5 : 0.7,
  });

  useEffect(() => {
    if (inView) {
      window.dispatchEvent(
        new CustomEvent("sectionInView", { detail: anchorId }),
      );
    }
  }, [inView, anchorId]);

  return (
    <div
      className={cn(
        "sm:bg-surface-default flex h-full w-full flex-col gap-6 border-b-2 border-b-white/10 px-4 py-8 sm:border-none sm:px-5 sm:py-7",
        isSwitchDateLinear && "mt-4 gap-4",
        className,
      )}
      id={anchorId}
      ref={ref}
    >
      <div className="flex h-full w-full flex-col gap-3">
        <div
          className={cn("flex flex-col gap-2", {
            "gap-0": isSwitchDateLinear,
          })}
        >
          <div className="flex h-full w-full flex-col gap-2 sm:flex-row sm:gap-3">
            {isSwitchDateLinear && (
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  {icon}
                  <h3 className="text-primary text-xl leading-7 font-medium tracking-[-0.5%] sm:text-left">
                    {title}
                  </h3>
                </div>
                <div className="flex items-center">{switchDate}</div>
              </div>
            )}
            {!isSwitchDateLinear && (
              <>
                <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                  <div className="flex items-center gap-2">
                    <div>{icon}</div>
                    <h4 className="text-xl leading-7 font-medium tracking-[-0.5%] text-white sm:text-left">
                      {title}
                    </h4>
                  </div>
                  {subHeader && (
                    <div className="flex items-center gap-2">{subHeader}</div>
                  )}
                </div>
                <div className="hidden items-center sm:flex">
                  {riskLevel && <div className="flex h-full">{riskLevel}</div>}
                </div>
              </>
            )}
          </div>
          <div className="flex w-full">
            <p className="text-secondary flex w-full flex-col text-justify text-[12px] leading-[18px] font-normal sm:text-sm">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center sm:hidden">
          {riskLevel && <div className="flex h-full w-full">{riskLevel}</div>}
        </div>
      </div>

      {!isSwitchDateLinear && switchDate && (
        <div
          className={cn(
            "h-full w-full items-center justify-between",
            isSwitchDateLinear ? "hidden" : "flex",
          )}
        >
          {leftContent ? (
            <div className="flex h-full w-full items-center justify-between">
              {leftContent}
            </div>
          ) : (
            <div className="flex flex-col">
              <CardTitle className="!text-alternative-sm text-primary flex items-center font-mono font-medium tracking-wide uppercase sm:gap-2.5">
                {subtitle}
              </CardTitle>
              <p
                className={`text-secondary font-normal ${subtitle ? "text-sm" : "text-base"}`}
              >
                {getDateRange(days ?? "")}
              </p>
            </div>
          )}
          <div className="flex items-center">{switchDate}</div>
        </div>
      )}

      {infoText && (
        <CardDescription className="bg-surface-contrast flex w-full items-start gap-2 rounded-lg p-2 sm:items-center">
          <div className="mt-0.5 sm:mt-0">
            <Info className="text-primary size-4 w-fit" />
          </div>
          <p className="text-secondary text-sm font-normal">{infoText}</p>
        </CardDescription>
      )}
      {children}
    </div>
  );
};
