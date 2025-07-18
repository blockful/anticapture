"use client";

import Link from "next/link";
import { Card, CardContent } from "@/shared/components/ui/card";
import { FundingSourcesCardProps } from "@/features/donation/types";
import { DaoAvatarIcon } from "@/shared/components/icons/DaoAvatarIcon";
import { ExternalLink } from "lucide-react";

export const FundingSourcesCard = ({
  title,
  description,
  sources,
}: FundingSourcesCardProps) => {
  return (
    <Card className="bg-surface-background sm:bg-surface-default w-full rounded-none border-0 shadow-sm">
      <CardContent className="px-0 py-5 sm:p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-primary !text-alternative-sm font-mono font-medium uppercase">
              {title}
            </h3>
            <p className="text-secondary text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Horizontal layout for funding sources */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {sources.map((source, index) => (
              <Link
                key={index}
                href={source.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full cursor-pointer"
              >
                <div className="bg-surface-default text-primary border-light-dark hover:bg-middle-dark flex h-full items-center gap-3 border p-3 transition-colors sm:bg-transparent">
                  <DaoAvatarIcon
                    daoId={source.daoId}
                    className="size-9"
                    isRounded={true}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm flex items-center gap-1 truncate font-medium">
                        {source.name}
                      </h4>
                      <div className="bg-success/12 text-success flex items-center gap-1 rounded-full px-1.5 py-0.5">
                        <span className="text-accent text-xs font-medium whitespace-nowrap">
                          {source.amount}
                        </span>
                      </div>
                    </div>
                    <p className="text-secondary text-xs">{source.date}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
