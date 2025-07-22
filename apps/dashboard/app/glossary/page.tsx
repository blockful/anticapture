"use client";

import { useState } from "react";
import { HeaderSidebar } from "@/widgets";
import { TheSectionLayout } from "@/shared/components";
import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { BookOpen } from "lucide-react";
import {
  SAMPLE_GLOSSARY_DATA,
  getAvailableLetters,
  GlossaryKeyboard,
  GlossarySearch,
  GlossarySearchResult,
} from "@/features/glossary";

export default function GlossaryPage() {
  const availableLetters = getAvailableLetters(SAMPLE_GLOSSARY_DATA);
  const [searchResults, setSearchResults] = useState<GlossarySearchResult[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchResults = (results: GlossarySearchResult[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <TheSectionLayout
              title={SECTIONS_CONSTANTS.glossary.title}
              icon={<BookOpen className="section-layout-icon" />}
              description={SECTIONS_CONSTANTS.glossary.description}
              anchorId={SECTIONS_CONSTANTS.glossary.anchorId}
              className="bg-surface-background! mt-[56px]! sm:mt-0!"
            >
              <div className="flex gap-8">
                {/* Sticky Sidebar - Left Side */}
                <div className="w-80 flex-shrink-0">
                  <div className="sticky top-4 space-y-6">
                    {/* Search Input */}
                    <GlossarySearch
                      glossaryData={SAMPLE_GLOSSARY_DATA}
                      onSearchResults={handleSearchResults}
                      onClearSearch={handleClearSearch}
                    />

                    {/* Keyboard (only show when not searching) */}
                    {!isSearching && (
                      <GlossaryKeyboard glossaryData={SAMPLE_GLOSSARY_DATA} />
                    )}
                  </div>
                </div>

                {/* Content - Right Side */}
                <div className="min-w-0 flex-1">
                  {isSearching ? (
                    /* Search Results */
                    <div className="space-y-6">
                      <div className="mb-4">
                        <h3 className="text-primary text-lg font-semibold">
                          Search Results ({searchResults.length} found)
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {searchResults.length > 0 ? (
                          searchResults.map((result, index) => (
                            <div
                              key={index}
                              className="bg-surface-secondary rounded-lg p-4"
                            >
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
                  ) : (
                    /* Regular Glossary Content */
                    <div className="space-y-8">
                      {availableLetters.map((letter) => (
                        <div
                          key={letter}
                          id={`letter-${letter}`}
                          className="scroll-mt-4"
                        >
                          <h4 className="text-primary border-surface-border mb-4 border-b pb-2 text-2xl font-bold">
                            {letter}
                          </h4>
                          <div className="grid gap-4">
                            {SAMPLE_GLOSSARY_DATA[letter].map((term, index) => (
                              <div
                                key={index}
                                className="bg-surface-secondary rounded-lg p-4"
                              >
                                <h5 className="text-primary mb-2 text-lg font-semibold">
                                  {term.term}
                                </h5>
                                <p className="text-secondary leading-relaxed">
                                  {term.definition}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TheSectionLayout>
          </div>
        </div>
      </main>
    </div>
  );
}
