"use client";

import { Card, CardContent } from "@/shared/components/ui/card";
import { FundingSourcesCardProps } from "@/features/donation/types";
import { ExternalLink } from "lucide-react";

export const FundingSourcesCard = ({
  title,
  description,
  sources,
}: FundingSourcesCardProps) => {
  return (
    <Card className="bg-surface-default w-full border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="space-y-6">
          <div>
            <h3 className="text-primary !text-alternative-sm mb-2 font-mono font-medium tracking-wide uppercase">
              {title}
            </h3>
            <p className="text-secondary text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Horizontal layout for funding sources */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {sources.map((source, index) => {
              const SourceContent = (
                <div className="bg-surface-background hover:bg-surface-background/80 flex h-full items-center gap-4 rounded-lg p-4 transition-colors">
                  {source.logo && (
                    <div className="bg-surface-secondary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                      <img
                        src={source.logo}
                        alt={`${source.name} logo`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="text-primary flex items-center gap-1 truncate text-sm font-medium">
                        {source.name}
                        {source.link && (
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        )}
                      </h4>
                      <span className="text-accent ml-2 text-sm font-medium whitespace-nowrap">
                        {source.amount}
                      </span>
                    </div>
                    <p className="text-secondary text-xs">{source.date}</p>
                  </div>
                </div>
              );

              return source.link ? (
                <a
                  key={index}
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full cursor-pointer"
                >
                  {SourceContent}
                </a>
              ) : (
                <div key={index} className="h-full">
                  {SourceContent}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
