import { GlossarySearchResult } from "@/features/glossary/glossary";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { SearchIcon } from "lucide-react";

interface GlossarySearchResultsProps {
  results: GlossarySearchResult[];
}

export function GlossarySearchResults({ results }: GlossarySearchResultsProps) {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-primary text-lg font-medium">
          Search Results [{results.length} found]
        </h3>
      </div>
      <div className="divide-border-default space-y-4 divide-y">
        {results.length > 0 ? (
          results.map((result, index) => (
            <div
              key={index}
              className="bg-surface-secondary grid grid-cols-1 p-4 md:grid-cols-5"
            >
              <h5 className="text-primary font-roboto-mono text-alternative-sm pr-4 font-medium uppercase leading-[20px] tracking-[0.78px]">
                {result.term.title}
              </h5>
              <p
                className="font-inter text-secondary text-alternative-sm font-normal leading-[20px] md:col-span-4"
                style={{ fontStyle: "normal" }}
              >
                {result.term.definition}
              </p>
            </div>
          ))
        ) : (
          <BlankSlate
            variant="default"
            icon={SearchIcon}
            description="No terms found matching your search."
          />
        )}
      </div>
    </div>
  );
}
