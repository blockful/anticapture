"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import {
  GlossaryData,
  searchGlossary,
  GlossarySearchResult,
} from "@/features/glossary/glossary";

interface GlossarySearchProps {
  glossaryData: GlossaryData;
  onSearchResults?: (results: GlossarySearchResult[]) => void;
  onClearSearch?: () => void;
}

export function GlossarySearch({
  glossaryData,
  onSearchResults,
  onClearSearch,
}: GlossarySearchProps) {
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
    <div className="relative mx-auto w-full max-w-lg">
      <div className="relative">
        <Search className="text-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
        <input
          type="text"
          placeholder="Search the word..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-surface-background border-surface-border text-primary placeholder:text-secondary focus:ring-primary focus:border-primary w-full rounded-lg border py-3 pl-10 pr-4 transition-all duration-200 focus:outline-none focus:ring-2"
        />
      </div>
    </div>
  );
}
