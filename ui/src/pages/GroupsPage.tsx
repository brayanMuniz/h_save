import React, { useEffect, useState, useMemo } from "react";
import type { Group } from "../types";

import GroupCard from "../components/GroupCard";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";

interface GroupFilters {
  showFavoritesOnly: boolean;
  minDoujinCount: string;
  minOCount: string;
  minRating: string;
}

type SortKey = "name" | "doujinCount" | "totalOCount" | "averageRating";
type SortOrder = "asc" | "desc";

interface GroupSort {
  key: SortKey;
  order: SortOrder;
}

const GroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<GroupFilters>({
    showFavoritesOnly: false,
    minDoujinCount: "",
    minOCount: "",
    minRating: "0",
  });

  const [sort, setSort] = useState<GroupSort>({ key: "name", order: "asc" });

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/groups");
        if (!response.ok) {
          throw new Error(`Failed to fetch groups: ${response.statusText}`);
        }
        const data = await response.json();
        setGroups(data.groups || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleToggleFavorite = async (
    groupId: number,
    currentIsFavorite: boolean,
  ) => {
    const originalGroups = [...groups];

    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? { ...group, isFavorite: !currentIsFavorite }
          : group,
      ),
    );

    try {
      const method = currentIsFavorite ? "DELETE" : "POST";
      const response = await fetch(`/api/user/favorite/group/${groupId}`, {
        method: method,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
          `Failed to ${currentIsFavorite ? "unfavorite" : "favorite"
          } group`,
        );
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      setGroups(originalGroups);
      alert(
        `Error: ${err instanceof Error ? err.message : "Could not update favorite"
        }`,
      );
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

  const filteredAndSortedGroups = useMemo(() => {
    let processedGroups = [...groups];

    if (filters.showFavoritesOnly) {
      processedGroups = processedGroups.filter((g) => g.isFavorite);
    }
    if (filters.minDoujinCount) {
      const minCount = parseInt(filters.minDoujinCount, 10);
      if (!isNaN(minCount)) {
        processedGroups = processedGroups.filter(
          (g) => g.doujinCount >= minCount,
        );
      }
    }
    if (filters.minOCount) {
      const minO = parseInt(filters.minOCount, 10);
      if (!isNaN(minO)) {
        processedGroups = processedGroups.filter((g) => g.totalOCount >= minO);
      }
    }
    if (filters.minRating && filters.minRating !== "0") {
      const minR = parseFloat(filters.minRating);
      processedGroups = processedGroups.filter(
        (g) => g.averageRating !== null && g.averageRating >= minR,
      );
    }

    processedGroups.sort((a, b) => {
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

    return processedGroups;
  }, [groups, filters, sort]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading groups...</div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
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
                  placeholder="e.g., 5"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

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

          {filteredAndSortedGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-10">
              <p className="text-xl">
                No groups found matching your criteria.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GroupsPage;
