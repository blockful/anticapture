"use client";

import { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { DotFilledIcon } from "@radix-ui/react-icons";
import { cn } from "@/shared/utils/";
import { Stage } from "@/shared/types/enums/Stage";
import { useParams } from "next/navigation";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfigByDaoId from "@/shared/dao-config";

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
  isCompleted?: boolean;
}

export const StageContent = ({
  stage,
  title,
  description,
  type,
  issues,
  requirementText,
  isCompleted,
}: StageContentProps) => {
  const { daoId } = useParams<{ daoId: string }>();
  const selectedDaoId = (daoId || "").toUpperCase() as DaoIdEnum;
  const daoName = daoConfigByDaoId[selectedDaoId].name;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="bg-surface-contrast flex w-full flex-col gap-4 rounded-md p-3 sm:flex-row">
        <div className="flex flex-col gap-1 sm:max-w-[200px]">
          <h3 className="text-alternative-sm text-primary font-mono font-medium uppercase tracking-wide">
            {title}
          </h3>
          <p className="text-secondary text-sm font-normal">{description}</p>
        </div>
        <div className="flex flex-col gap-4">
          {type === "requirements" && (
            <h4 className="text-primary font-mono text-xs font-medium uppercase tracking-wide">
              Requirements
            </h4>
          )}
          {type === "issues" &&
            (isCompleted ? (
              daoName && (
                <h4
                  className={cn(
                    "text-primary font-mono text-xs font-medium uppercase tracking-wide",
                  )}
                >
                  {daoName} is currently in here!
                </h4>
              )
            ) : (
              <h4
                className={cn(
                  "text-primary font-mono text-xs font-medium uppercase tracking-wide",
                  stage === Stage.ONE && "text-error",
                  stage === Stage.TWO && "text-warning",
                )}
              >
                Issues that need to be fixed
              </h4>
            ))}

          {type === "requirements" ? (
            <div className="flex flex-row gap-2">
              <p className="text-secondary flex flex-wrap text-sm font-normal">
                {requirementText}
              </p>
            </div>
          ) : (
            issues?.map((issue, index) => (
              <div key={index}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    {stage === Stage.ONE && !isCompleted && (
                      <div>
                        <AlertTriangle
                          className={cn(
                            "size-4",
                            stage === Stage.ONE && "text-error",
                          )}
                        />
                      </div>
                    )}
                    {stage === Stage.TWO && !isCompleted && (
                      <div>
                        <AlertCircle
                          className={cn(
                            "size-4",
                            stage === Stage.TWO && "text-warning",
                          )}
                        />
                      </div>
                    )}
                    {isCompleted && (
                      <div>
                        <CheckCircle className="text-success" size={14} />
                      </div>
                    )}
                    <p className="text-primary text-sm font-normal">
                      {issue.title}
                    </p>
                  </div>
                  <div className="flex justify-start gap-2">
                    <div className="flex flex-col gap-1">
                      {issue.description.map((desc, i) => (
                        <div key={i} className="flex flex-row gap-2">
                          <div>
                            <DotFilledIcon className="size-4 text-zinc-600" />
                          </div>
                          <p
                            key={i}
                            className="text-secondary text-sm font-normal"
                          >
                            {desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {index < issues.length - 1 && (
                    <div className="border-middle-dark border-t" />
                  )}
                  {index === issues.length - 1 && <div className="pb-2" />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
