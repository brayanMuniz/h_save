import React, { useEffect, useState, useMemo } from "react";
import type { Tag } from "../types";

import TagCard from "../components/TagCard";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";

interface TagFilters {
  showFavoritesOnly: boolean;
  minDoujinCount: string;
  minOCount: string;
  minRating: string;
}

type SortKey = "name" | "doujinCount" | "totalOCount" | "averageRating";
type SortOrder = "asc" | "desc";

interface TagSort {
  key: SortKey;
  order: SortOrder;
}

const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TagFilters>({
    showFavoritesOnly: false,
    minDoujinCount: "",
    minOCount: "",
    minRating: "0",
  });

  const [sort, setSort] = useState<TagSort>({ key: "name", order: "asc" });

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/tags"); // Fetch from the new endpoint
        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.statusText}`);
        }
        const data = await response.json();
        setTags(data.tags || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleToggleFavorite = async (
    tagId: number,
    currentIsFavorite: boolean,
  ) => {
    setTags((prevTags) =>
      prevTags.map((tag) =>
        tag.id === tagId ? { ...tag, isFavorite: !currentIsFavorite } : tag,
      ),
    );

    try {
      const method = currentIsFavorite ? "DELETE" : "POST";
      const response = await fetch(`/api/user/favorite/tag/${tagId}`, {
        method: method,
      });
      if (!response.ok) throw new Error("Failed to update favorite status");
    } catch (err) {
      // Revert on error
      setTags((prevTags) =>
        prevTags.map((tag) =>
          tag.id === tagId ? { ...tag, isFavorite: currentIsFavorite } : tag,
        ),
      );
      alert("Could not update favorite status.");
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFilters((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSort((prev) => ({ ...prev, [name]: value as SortKey | SortOrder }));
  };

  const filteredAndSortedTags = useMemo(() => {
    let processedTags = [...tags];

    // Apply filters (logic is identical to artists page)
    if (filters.showFavoritesOnly) {
      processedTags = processedTags.filter((t) => t.isFavorite);
    }
    if (filters.minDoujinCount) {
      processedTags = processedTags.filter(
        (t) => t.doujinCount >= parseInt(filters.minDoujinCount, 10),
      );
    }
    if (filters.minOCount) {
      processedTags = processedTags.filter(
        (t) => t.totalOCount >= parseInt(filters.minOCount, 10),
      );
    }
    if (filters.minRating !== "0") {
      processedTags = processedTags.filter(
        (t) =>
          t.averageRating !== null &&
          t.averageRating >= parseFloat(filters.minRating),
      );
    }

    // Apply sorting (logic is identical)
    processedTags.sort((a, b) => {
      const valA = a[sort.key];
      const valB = b[sort.key];
      const order = sort.order === "asc" ? 1 : -1;

      if (typeof valA === "string" && typeof valB === "string") {
        return valA.localeCompare(valB) * order;
      }
      if (valA === null) return 1 * order;
      if (valB === null) return -1 * order;
      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });

    return processedTags;
  }, [tags, filters, sort]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading tags...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl p-6 bg-gray-800 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="lg:ml-64">
        <MobileNav />
        <main className="flex-1 p-6">
          <div className="bg-gray-800 p-4 rounded-lg mb-6 shadow">
            {/* Filter and Sort Bar JSX is identical, just change labels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
              {/* Favorite Filter */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showFavoritesOnly"
                  name="showFavoritesOnly"
                  checked={filters.showFavoritesOnly}
                  onChange={handleFilterChange}
                  className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 mr-2"
                />
                <label
                  htmlFor="showFavoritesOnly"
                  className="text-sm font-medium text-gray-300"
                >
                  Favorites Only
                </label>
              </div>

              {/* Min Doujin Count */}
              <div>
                <label
                  htmlFor="minDoujinCount"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Min Works
                </label>
                <input
                  type="number"
                  id="minDoujinCount"
                  name="minDoujinCount"
                  value={filters.minDoujinCount}
                  onChange={handleFilterChange}
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Min O-Count */}
              <div>
                <label
                  htmlFor="minOCount"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Min ♥
                </label>
                <input
                  type="number"
                  id="minOCount"
                  name="minOCount"
                  value={filters.minOCount}
                  onChange={handleFilterChange}
                  placeholder="e.g., 100"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label
                  htmlFor="minRating"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Min Avg. ★
                </label>
                <select
                  id="minRating"
                  name="minRating"
                  value={filters.minRating}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="0">All</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="sortKey"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Sort By
                  </label>
                  <select
                    id="sortKey"
                    name="key"
                    value={sort.key}
                    onChange={handleSortChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="name">Name</option>
                    <option value="doujinCount">Works</option>
                    <option value="totalOCount">Total ♥</option>
                    <option value="averageRating">Avg. Rating</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="sortOrder"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Order
                  </label>
                  <select
                    id="sortOrder"
                    name="order"
                    value={sort.order}
                    onChange={handleSortChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tag Grid */}
          {filteredAndSortedTags.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAndSortedTags.map((tag) => (
                <TagCard
                  key={tag.id}
                  tag={tag}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-10">
              <p className="text-xl">No tags found matching your criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TagsPage;
