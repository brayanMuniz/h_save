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

  // Updated initial state for filters, without bookmarkCount
  const [filters, setFilters] = useState<BrowseFilters>({
    artists: { included: [], excluded: [] },
    groups: { included: [], excluded: [] },
    tags: { included: [], excluded: [] },
    characters: { included: [], excluded: [] },
    parodies: { included: [], excluded: [] },
    languages: ["all"],
    rating: { min: 0, max: 5 },
    oCount: { min: 0, max: 100 },
    pageCount: { min: 0, max: 500 },
    currentlyReading: false,
    formats: [],
    genres: [],
    search: "",
  });

  const filteredAndSortedDoujinshi = useMemo(() => {
    const filtered = doujinshi.filter((item) => {
      // Search filter
      if (
        filters.search &&
        !item.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // "Currently Reading" Filter
      if (filters.currentlyReading) {
        const lastPage = item.progress?.lastPage ?? 0;
        const totalPages = parseInt(item.pages, 10);
        const isReading =
          !isNaN(totalPages) && lastPage > 0 && lastPage < totalPages;
        if (!isReading) {
          return false;
        }
      }

      // Language filter
      if (!filters.languages.includes("all")) {
        const hasLanguage = (item.languages || []).some((lang) =>
          filters.languages.some((filterLang) =>
            lang.toLowerCase().includes(filterLang),
          ),
        );
        if (!hasLanguage) return false;
      }

      // Range filters (bookmarkCount logic removed)
      const rating = item.progress?.rating ?? 0;
      const totalPages = parseInt(item.pages, 10) || 0;
      if (
        rating < filters.rating.min ||
        rating > filters.rating.max ||
        item.oCount < filters.oCount.min ||
        item.oCount > filters.oCount.max ||
        totalPages < filters.pageCount.min ||
        totalPages > filters.pageCount.max
      ) {
        return false;
      }

      // Included/Excluded entity filters
      const filterTypes = [
        "tags",
        "artists",
        "characters",
        "parodies",
        "groups",
      ] as const;
      for (const filterType of filterTypes) {
        const itemValues = item[filterType] || [];
        const filterGroup = filters[filterType];

        if (filterGroup.excluded.length > 0) {
          const hasExcluded = filterGroup.excluded.some((excludedValue) =>
            itemValues.some((itemValue) =>
              itemValue?.toLowerCase().includes(excludedValue.toLowerCase()),
            ),
          );
          if (hasExcluded) return false;
        }

        if (filterGroup.included.length > 0) {
          const hasAllIncluded = filterGroup.included.every((includedValue) =>
            itemValues.some((itemValue) =>
              itemValue?.toLowerCase().includes(includedValue.toLowerCase()),
            ),
          );
          if (!hasAllIncluded) return false;
        }
      }

      return true;
    });

    // Sorting logic remains the same
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
          return (
            new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
          );
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
