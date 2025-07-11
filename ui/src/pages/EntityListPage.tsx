import React, { useEffect, useState, useMemo } from "react";
import type { EntitySortKey, SortOrder } from "../types";

import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import EntityCard from "../components/EntityCard";

interface Entity {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null;
  imageCount?: number; // Only for tags for now
}

interface EntityFilters {
  showFavoritesOnly: boolean;
  minDoujinCount: string;
  minOCount: string;
  minRating: string;
}

interface EntitySort {
  key: EntitySortKey;
  order: SortOrder;
}

interface EntityListPageProps {
  entityName: string;
  entityNamePlural: string;
  listApiEndpoint: string;
  favoriteApiEndpointPrefix: string;
  entityLinkPrefix: string;
  icon: string;
}

const EntityListPage: React.FC<EntityListPageProps> = ({
  entityName,
  entityNamePlural,
  listApiEndpoint,
  favoriteApiEndpointPrefix,
  entityLinkPrefix,
  icon,
}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<EntityFilters>({
    showFavoritesOnly: false,
    minDoujinCount: "",
    minOCount: "",
    minRating: "0",
  });

  // The state is now correctly typed with our EntitySort interface
  const [sort, setSort] = useState<EntitySort>({ key: "name", order: "asc" });

  useEffect(() => {
    const fetchEntities = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(listApiEndpoint);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${entityNamePlural.toLowerCase()}: ${response.statusText
            }`,
          );
        }
        const data = await response.json();
        // If this is the tag list, map imageCount
        if (entityNamePlural.toLowerCase() === 'tags') {
          setEntities((data.tags || []).map((tag: any) => ({
            ...tag,
            imageCount: tag.imageCount ?? 0,
          })));
        } else {
          setEntities(data[entityNamePlural.toLowerCase()] || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [listApiEndpoint, entityNamePlural]);

  const handleToggleFavorite = async (
    entityId: number,
    currentIsFavorite: boolean,
  ) => {
    const originalEntities = [...entities];
    setEntities((prevEntities) =>
      prevEntities.map((entity) =>
        entity.id === entityId
          ? { ...entity, isFavorite: !currentIsFavorite }
          : entity,
      ),
    );

    try {
      const method = currentIsFavorite ? "DELETE" : "POST";
      const response = await fetch(`${favoriteApiEndpointPrefix}/${entityId}`, {
        method,
      });
      if (!response.ok) throw new Error("Failed to update favorite status");
    } catch (err) {
      setEntities(originalEntities);
      alert(`Could not update favorite status for ${entityName}.`);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFilters((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    // The type assertion now correctly uses EntitySortKey
    setSort((prev) => ({ ...prev, [name]: value as EntitySortKey | SortOrder }));
  };

  const filteredAndSortedEntities = useMemo(() => {
    let processed = [...entities];

    // Apply filters first
    if (filters.showFavoritesOnly) {
      processed = processed.filter((e) => e.isFavorite);
    }
    if (filters.minDoujinCount) {
      const min = parseInt(filters.minDoujinCount, 10);
      if (!isNaN(min))
        processed = processed.filter((e) => e.doujinCount >= min);
    }
    if (filters.minOCount) {
      const min = parseInt(filters.minOCount, 10);
      if (!isNaN(min))
        processed = processed.filter((e) => e.totalOCount >= min);
    }
    if (filters.minRating !== "0") {
      const min = parseFloat(filters.minRating);
      processed = processed.filter(
        (e) => e.averageRating !== null && e.averageRating >= min,
      );
    }

    // Handle sorting
    if (sort.key === "random") {
      // Fisher-Yates shuffle for true randomness
      for (let i = processed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [processed[i], processed[j]] = [processed[j], processed[i]];
      }
    } else {
      // Regular sorting logic
      processed.sort((a, b) => {
        const order = sort.order === "asc" ? 1 : -1;
        switch (sort.key) {
          case "name":
            return a.name.localeCompare(b.name) * order;
          case "doujinCount":
            return (a.doujinCount - b.doujinCount) * order;
          case "totalOCount":
            return (a.totalOCount - b.totalOCount) * order;
          case "averageRating":
            const ratingA = a.averageRating ?? -1;
            const ratingB = b.averageRating ?? -1;
            return (ratingA - ratingB) * order;
          default:
            return 0;
        }
      });
    }

    return processed;
  }, [entities, filters, sort]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          Loading {entityNamePlural.toLowerCase()}...
        </div>
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

          <h1 className="text-3xl font-bold text-gray-100 mb-6">
            {icon} {entityNamePlural}
          </h1>

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

                    <option value="random">Random</option>
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
                    disabled={sort.key === "random"}
                    className={`w-full px-3 py-2 border border-gray-600 rounded-lg text-gray-200 text-sm focus:ring-indigo-500 focus:border-transparent ${sort.key === "random"
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gray-700"
                      }`}
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>


                </div>
              </div>
            </div>
          </div>

          {filteredAndSortedEntities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedEntities.map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  onToggleFavorite={handleToggleFavorite}
                  linkPrefix={entityLinkPrefix}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-10">
              <p className="text-xl">
                No {entityNamePlural.toLowerCase()} found matching your
                criteria.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EntityListPage;
