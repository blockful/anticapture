"use client";

import { ReactNode } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { DotFilledIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/client/utils";
import { Stage } from "@/components/atoms/StageTag";

interface Issue {
  title: string;
  description: string[];
}

interface StageContentProps {
  stage?: Stage;
  title: string;
  description: string;
  type: "requirements" | "issues";
  issues?: Issue[];
  requirementText?: ReactNode;
}

export const StageContent = ({
  stage,
  title,
  description,
  type,
  issues,
  requirementText,
}: StageContentProps) => {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full flex-col gap-4 rounded-md bg-lightDark p-3 sm:flex-row">
        <div className="flex flex-col gap-1 sm:max-w-[200px]">
          <h3 className="font-roboto text-[13px] font-medium uppercase leading-[18px] tracking-wide text-white">
            {title}
          </h3>
          <p className="text-sm font-normal text-foreground">{description}</p>
        </div>
        <div className="flex flex-col gap-4">
          {type === "requirements" && (
            <h4 className="font-roboto text-xs font-medium uppercase tracking-wide text-white">
              Requirements
            </h4>
          )}
          {type === "issues" && (
            <h4
              className={cn(
                "font-roboto text-xs font-medium uppercase tracking-wide text-white",
                stage === Stage.ONE && "text-error",
                stage === Stage.TWO && "text-warning",
              )}
            >
              Issues that need to be fixed
            </h4>
          )}

          {type === "requirements" ? (
            <div className="flex flex-row gap-2">
              <p className="flex flex-wrap text-sm font-normal text-foreground">
                {requirementText}
              </p>
            </div>
          ) : (
            issues?.map((issue, index) => (
              <div key={index}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={cn(
                        "size-4",
                        stage === Stage.ONE && "text-error",
                        stage === Stage.TWO && "text-warning",
                      )}
                    />
                    <p className="text-sm font-normal text-white">
                      {issue.title}
                    </p>
                  </div>
                  <div className="flex justify-start gap-2">
                    <div className="flex flex-col gap-1">
                      {issue.description.map((desc, i) => (
                        <div key={i} className="flex flex-row gap-2">
                          <div>
                            <DotFilledIcon className="size-4 text-[#52525B]" />
                          </div>
                          <p
                            key={i}
                            className="text-sm font-normal text-foreground"
                          >
                            {desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {index < issues.length - 1 && (
                  <div className="my-2 border-t border-middleDark" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
