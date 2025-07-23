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
    <div className="mx-auto w-[274px]">
      <div className="border-secondary bg-primary-foreground flex items-center gap-2.5 rounded-md border px-2.5 py-2 transition-all duration-200">
        <Search className="text-secondary h-5 w-5 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search the word..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="text-primary placeholder:text-secondary w-full bg-transparent focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}
