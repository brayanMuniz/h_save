import { useState, useEffect, useMemo } from "react";
import type { Doujinshi, BrowseFilters, SavedFilter } from "../types";

import FilterSidebar from "../components/FilterSideBar";
import MobileFilterBar from "../components/MobileFilterBar";
import BrowseContent from "../components/BrowseContent";
import SelectedFiltersBar from "../components/SelectedFiltersBar";

const initialFilters: BrowseFilters = {
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
  bookmarkCount: { min: 0, max: 50 },
};

const BrowsePage = () => {
  const [doujinshi, setDoujinshi] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "cover">("cover");
  const [sortBy, setSortBy] = useState("uploaded");
  const [filters, setFilters] = useState<BrowseFilters>(initialFilters);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  const fetchSavedFilters = async () => {
    try {
      const response = await fetch("/api/user/saved-filters");
      if (!response.ok) throw new Error("Failed to fetch saved filters.");
      const data = await response.json();
      setSavedFilters(data.savedFilters || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSavedFilters();
  }, []);

  const handleSaveFilter = async () => {
    const name = prompt("Enter a name for this filter set:");
    if (!name || !name.trim()) return;
    try {
      const response = await fetch("/api/user/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), filters }),
      });
      if (!response.ok) throw new Error("Failed to save filter.");
      fetchSavedFilters(); // Refresh the list after saving
    } catch (error) {
      console.error(error);
      alert("Error: Could not save the filter.");
    }
  };

  const handleLoadFilter = (filtersToLoad: Partial<BrowseFilters>) => {
    setFilters({ ...initialFilters, ...filtersToLoad });
  };

  const handleDeleteFilter = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this saved filter?"))
      return;
    try {
      const response = await fetch(`/api/user/saved-filters/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete filter.");
      fetchSavedFilters(); // Refresh the list after deleting
    } catch (error) {
      console.error(error);
      alert("Error: Could not delete the filter.");
    }
  };

  const handleClearAllTagFilters = () => {
    setFilters({
      ...filters,
      tags: { included: [], excluded: [] },
      artists: { included: [], excluded: [] },
      characters: { included: [], excluded: [] },
      parodies: { included: [], excluded: [] },
      groups: { included: [], excluded: [] },
      currentlyReading: false,
    });
  };

  const filteredAndSortedDoujinshi = useMemo(() => {
    const filtered = doujinshi.filter((item) => {
      if (
        filters.search &&
        !item.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.currentlyReading) {
        const lastPage = item.progress?.lastPage ?? 0;
        const totalPages = parseInt(item.pages, 10);
        const isReading =
          !isNaN(totalPages) && lastPage > 0 && lastPage < totalPages;
        if (!isReading) {
          return false;
        }
      }
      if (!filters.languages.includes("all")) {
        const hasLanguage = (item.languages || []).some((lang) =>
          filters.languages.some((filterLang) =>
            lang.toLowerCase().includes(filterLang),
          ),
        );
        if (!hasLanguage) return false;
      }
      const rating = item.progress?.rating ?? 0;
      const totalPages = parseInt(item.pages, 10) || 0;
      if (
        rating < filters.rating.min ||
        rating > filters.rating.max ||
        item.oCount < filters.oCount.min ||
        item.oCount > filters.oCount.max ||
        totalPages < filters.pageCount.min ||
        totalPages > filters.pageCount.max ||
        item.bookmarkCount < filters.bookmarkCount.min ||
        item.bookmarkCount > filters.bookmarkCount.max
      ) {
        return false;
      }
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

    if (sortBy === "random") {
      return [...filtered].sort(() => Math.random() - 0.5);
    }

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
      <div className="hidden md:block">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          doujinshi={doujinshi}
          sortBy={sortBy}
          setSortBy={setSortBy}
          savedFilters={savedFilters}
          onSaveFilter={handleSaveFilter}
          onLoadFilter={handleLoadFilter}
          onDeleteFilter={handleDeleteFilter}
        />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <MobileFilterBar
          savedFilters={savedFilters}
          onLoadFilter={handleLoadFilter}
          onDeleteFilter={handleDeleteFilter}
          onClearAll={handleClearAllTagFilters}
        />
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
