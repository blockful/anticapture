import { GlossarySearchResult } from "@/features/glossary/glossary";

interface GlossarySearchResultsProps {
  results: GlossarySearchResult[];
}

export function GlossarySearchResults({ results }: GlossarySearchResultsProps) {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-primary text-lg font-semibold">
          Search Results ({results.length} found)
        </h3>
      </div>
      <div className="divide-border-default space-y-4 divide-y">
        {results.length > 0 ? (
          results.map((result, index) => (
            <div
              key={index}
              className="bg-surface-secondary grid grid-cols-1 p-4 md:grid-cols-5"
            >
              <h5 className="text-primary font-roboto-mono text-[13px] font-medium uppercase leading-[20px] tracking-[0.78px]">
                {result.term.term}
              </h5>
              <p
                className="font-inter text-secondary text-[14px] font-normal leading-[20px] md:col-span-4"
                style={{ fontStyle: "normal" }}
              >
                {result.term.definition}
              </p>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-secondary">
              No terms found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
