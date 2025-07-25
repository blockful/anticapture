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
  GlossaryMobileKeyboard,
  GlossarySearch,
  GlossarySearchResult,
  GlossarySearchResults,
  GlossaryContent,
} from "@/features/glossary";
import { HeaderMobile } from "@/widgets/HeaderMobile";

export default function GlossaryPage() {
  const availableLetters = getAvailableLetters(SAMPLE_GLOSSARY_DATA);
  const [searchResults, setSearchResults] = useState<GlossarySearchResult[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchGlossaryWords = (results: GlossarySearchResult[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div className="bg-surface-background dark flex h-screen">
      <HeaderSidebar />

      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="sm:hidden">
          <div className="h-[57px] w-full sm:hidden">banana</div>
          <HeaderMobile overlayClassName="top-[57px]" />
        </div>

        <div className="xl4k:min-h-screen flex w-full flex-col items-center">
          <div className="xl4k:max-w-7xl w-full">
            <TheSectionLayout
              title={SECTIONS_CONSTANTS.glossary.title}
              icon={<BookOpen className="section-layout-icon" />}
              description={SECTIONS_CONSTANTS.glossary.description}
              anchorId={SECTIONS_CONSTANTS.glossary.anchorId}
              className="bg-surface-background! sm:mt-0! gap-4! md:gap-6!"
            >
              <div className="border-light-dark flex flex-col gap-2 border-t border-dashed py-5 md:flex-row md:gap-10 md:border-none">
                {/* Sticky Sidebar - Left Side */}
                <div className="flex-shrink-0">
                  <div className="sticky top-4 md:space-y-6">
                    {/* Search Input */}
                    <GlossarySearch
                      glossaryData={SAMPLE_GLOSSARY_DATA}
                      onSearchResults={handleSearchGlossaryWords}
                      onClearSearch={handleClearSearch}
                    />

                    {/* Desktop Keyboard (only show when not searching) */}
                    {!isSearching && (
                      <GlossaryKeyboard glossaryData={SAMPLE_GLOSSARY_DATA} />
                    )}
                  </div>
                </div>
                {/* Mobile Keyboard - Fixed positioning */}
                {!isSearching && (
                  <GlossaryMobileKeyboard
                    className="mb-6"
                    glossaryData={SAMPLE_GLOSSARY_DATA}
                  />
                )}
                {/* Content - Right Side */}
                <div className="min-w-0 flex-1">
                  {isSearching ? (
                    <GlossarySearchResults results={searchResults} />
                  ) : (
                    <GlossaryContent
                      glossaryData={SAMPLE_GLOSSARY_DATA}
                      availableLetters={availableLetters}
                    />
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
