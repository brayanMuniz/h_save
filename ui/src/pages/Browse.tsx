import { useState, useEffect, useMemo } from "react";
import type { Doujinshi, BrowseFilters } from "../types";

import FilterSidebar from "../components/FilterSideBar";
import BrowseContent from "../components/BrowseContent";
import SelectedFiltersBar from "../components/SelectedFiltersBar";

const BrowsePage = () => {
  const [doujinshi, setDoujinshi] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "cover">("cover");
  const [sortBy, setSortBy] = useState("uploaded");
  const [filters, setFilters] = useState<BrowseFilters>({
    artists: { included: [], excluded: [] },
    groups: { included: [], excluded: [] },
    tags: { included: [], excluded: [] },
    characters: { included: [], excluded: [] },
    parodies: { included: [], excluded: [] },
    languages: ["all"],
    rating: { min: 0, max: 5 },
    oCount: { min: 0, max: 100 },
    formats: [],
    genres: [],
    search: "",
  });

  const filteredAndSortedDoujinshi = useMemo(() => {
    // First filter
    const filtered = doujinshi.filter((item) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!item.title.toLowerCase().includes(searchLower)) return false;
      }

      // Language filter
      if (!filters.languages.includes("all")) {
        const itemLanguages = item.languages || [];
        const hasLanguage = itemLanguages.some((lang) =>
          filters.languages.some((filterLang) =>
            lang.toLowerCase().includes(filterLang)
          )
        );
        if (!hasLanguage) return false;
      }

      // Rating range
      const rating = item.progress?.rating ?? 0;
      if (rating < filters.rating.min || rating > filters.rating.max) {
        return false;
      }

      // oCount range
      if (item.oCount < filters.oCount.min || item.oCount > filters.oCount.max) {
        return false;
      }

      // Filter groups (tags, artists, etc.) with proper null safety
      const filterTypes = ['tags', 'artists', 'characters', 'parodies', 'groups'] as const;

      for (const filterType of filterTypes) {
        const itemTags = item[filterType] || []; // Default to empty array if null/undefined
        const filterGroup = filters[filterType];

        // Check exclusions first
        if (filterGroup.excluded.length > 0) {
          const hasExcludedTag = filterGroup.excluded.some(excluded =>
            itemTags.some(tag =>
              tag && tag.toLowerCase().includes(excluded.toLowerCase())
            )
          );
          if (hasExcludedTag) return false;
        }

        // Check inclusions (if any are specified)
        if (filterGroup.included.length > 0) {
          const hasIncludedTag = filterGroup.included.some(included =>
            itemTags.some(tag =>
              tag && tag.toLowerCase().includes(included.toLowerCase())
            )
          );
          if (!hasIncludedTag) return false;
        }
      }

      return true;
    });

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "rating":
          return (b.progress?.rating ?? 0) - (a.progress?.rating ?? 0);
        case "ocount":
          return b.oCount - a.oCount;
        case "uploaded":
        default:
          return new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime();
      }
    });

    return sorted;
  }, [doujinshi, filters, sortBy]);

  useEffect(() => {
    fetch("/api/doujinshi")
      .then((res) => res.json())
      .then((data) => {
        setDoujinshi(data.doujinshi || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          Gathering the collection... please wait.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <FilterSidebar
        filters={filters}
        setFilters={setFilters}
        doujinshi={doujinshi}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div className="flex-1 flex flex-col">
        <SelectedFiltersBar filters={filters} setFilters={setFilters} />
        <BrowseContent
          doujinshi={filteredAndSortedDoujinshi}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filters={filters}
          setFilters={setFilters}
        />
      </div>
    </div>
  );
};

export default BrowsePage;
