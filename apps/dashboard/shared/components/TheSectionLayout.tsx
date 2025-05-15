"use client";

import { cn, getDateRange } from "@/shared/utils/utils";
import { useScreenSize } from "@/shared/hooks";
import { ReactNode, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Info } from "lucide-react";

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
}: {
  icon?: JSX.Element;
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
}) => {
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
        "flex h-full w-full flex-col gap-6 border-b-2 border-b-white/10 px-4 py-8 sm:border-none sm:bg-dark sm:px-5 sm:py-7",
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
                  <h1 className="text-xl font-medium leading-7 tracking-[-0.5%] text-[#FAFAFA] sm:text-left">
                    {title}
                  </h1>
                </div>
                <div className="flex items-center">{switchDate}</div>
              </div>
            )}
            {!isSwitchDateLinear && (
              <>
                <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                  <div className="flex items-center gap-2">
                    <div>{icon}</div>
                    <h1 className="text-xl font-medium leading-7 tracking-[-0.5%] text-[#FAFAFA] sm:text-left">
                      {title}
                    </h1>
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
            <p className="flex w-full flex-col text-justify text-[12px] font-normal leading-[18px] text-foreground sm:text-sm">
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
          <div className="flex flex-col">
            <CardTitle className="flex items-center font-mono text-[13px] font-medium uppercase leading-[18px] tracking-wide text-white sm:gap-2.5">
              {subtitle}
            </CardTitle>
            <p
              className={`font-normal text-foreground ${subtitle ? "text-sm" : "text-base"}`}
            >
              {getDateRange(days ?? "")}
            </p>
          </div>
          <div className="flex items-center">{switchDate}</div>
        </div>
      )}
      {infoText && (
        <CardDescription className="flex w-full items-start gap-2 rounded-lg bg-lightDark p-2 sm:items-center">
          <div className="mt-0.5 sm:mt-0">
            <Info className="size-4 w-fit text-white" />
          </div>
          <p className="text-sm font-normal text-foreground">{infoText}</p>
        </CardDescription>
      )}
      {children}
    </div>
  );
};
