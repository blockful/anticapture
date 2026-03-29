"use client";

import { useState } from "react";

import type {
  GlossaryData,
  GlossarySearchResult,
} from "@/features/glossary/glossary";
import { searchGlossary } from "@/features/glossary/glossary";
import SearchField from "@/shared/components/design-system/SearchField";

interface GlossarySearchProps {
  glossaryData: GlossaryData;
  onSearchResults?: (results: GlossarySearchResult[]) => void;
  onClearSearch?: () => void;
}

export const GlossarySearch = ({
  glossaryData,
  onSearchResults,
  onClearSearch,
}: GlossarySearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      onClearSearch?.();
      return;
    }

    const results = searchGlossary(glossaryData, query);
    onSearchResults?.(results);
  };

  return (
    <div className="mx-auto w-full lg:w-[274px]">
      <SearchField
        placeholder="Search the word..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
};
