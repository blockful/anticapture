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
      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((result, index) => (
            <div key={index} className="bg-surface-secondary rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="text-primary mb-2 text-lg font-semibold">
                    {result.term.term}
                  </h5>
                  <p className="text-secondary leading-relaxed">
                    {result.term.definition}
                  </p>
                </div>
                <span className="bg-surface-background text-secondary ml-4 rounded px-2 py-1 text-xs">
                  {result.letter}
                </span>
              </div>
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
