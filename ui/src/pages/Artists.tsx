import React, { useEffect, useState, useMemo } from "react";
import type { Artist } from "../types";
import { Link } from "react-router-dom";
import ArtistCard from "../components/ArtistCard";
import SettingsButton from "../components/SettingsButton";
import SyncButton from "../components/SyncButton";

// Define filter types
interface ArtistFilters {
  showFavoritesOnly: boolean;
  minDoujinCount: string;
  minOCount: string;
  minRating: string;
}

// Define sort types
type SortKey = "name" | "doujinCount" | "totalOCount" | "averageRating";
type SortOrder = "asc" | "desc";

interface ArtistSort {
  key: SortKey;
  order: SortOrder;
}

const ArtistsPage = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ArtistFilters>({
    showFavoritesOnly: false,
    minDoujinCount: "",
    minOCount: "",
    minRating: "0", // '0' means all ratings
  });

  const [sort, setSort] = useState<ArtistSort>({
    key: "name",
    order: "asc",
  });

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/artists");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch artists: ${response.statusText}`
          );
        }
        const data = await response.json();
        console.log(data)
        setArtists(data.artists || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Failed to fetch artists:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const handleToggleFavorite = async (
    artistId: number,
    currentIsFavorite: boolean
  ) => {
    const originalArtists = [...artists]; // For potential rollback on error

    // Optimistic UI update
    setArtists((prevArtists) =>
      prevArtists.map((artist) =>
        artist.id === artistId
          ? { ...artist, isFavorite: !currentIsFavorite }
          : artist
      )
    );

    try {
      const method = currentIsFavorite ? "DELETE" : "POST";
      const response = await fetch(
        `/api/user/favorite/artist/${artistId}`,
        {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
          `Failed to ${currentIsFavorite ? "unfavorite" : "favorite"
          } artist`
        );
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      setArtists(originalArtists);
      alert(
        `Error: ${err instanceof Error ? err.message : "Could not update favorite"
        }`
      );
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFilters((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSortChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSort((prev) => ({ ...prev, [name]: value as SortKey | SortOrder }));
  };

  const filteredAndSortedArtists = useMemo(() => {
    let processedArtists = [...artists];

    // Apply filters
    if (filters.showFavoritesOnly) {
      processedArtists = processedArtists.filter((a) => a.isFavorite);
    }
    if (filters.minDoujinCount) {
      const minCount = parseInt(filters.minDoujinCount, 10);
      if (!isNaN(minCount)) {
        processedArtists = processedArtists.filter(
          (a) => a.doujinCount >= minCount
        );
      }
    }
    if (filters.minOCount) {
      const minO = parseInt(filters.minOCount, 10);
      if (!isNaN(minO)) {
        processedArtists = processedArtists.filter(
          (a) => a.totalOCount >= minO
        );
      }
    }
    if (filters.minRating && filters.minRating !== "0") {
      const minR = parseFloat(filters.minRating);
      processedArtists = processedArtists.filter(
        (a) => a.averageRating !== null && a.averageRating >= minR
      );
    }

    // Apply sorting
    processedArtists.sort((a, b) => {
      let valA: string | number | null = null;
      let valB: string | number | null = null;

      switch (sort.key) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "doujinCount":
          valA = a.doujinCount;
          valB = b.doujinCount;
          break;
        case "totalOCount":
          valA = a.totalOCount;
          valB = b.totalOCount;
          break;
        case "averageRating":
          valA = a.averageRating === null ? -1 : a.averageRating; // Handle nulls for sorting
          valB = b.averageRating === null ? -1 : b.averageRating;
          break;
      }

      if (valA === null || valB === null) return 0; // Should not happen with current logic

      if (valA < valB) return sort.order === "asc" ? -1 : 1;
      if (valA > valB) return sort.order === "asc" ? 1 : -1;
      return 0;
    });

    return processedArtists;
  }, [artists, filters, sort]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading artists...</div>
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

      {/* Sidebar - Reusing structure from Home */}
      <aside className="hidden lg:flex w-64 h-screen bg-gray-800 text-gray-200 flex-col p-6 rounded-r-2xl fixed top-0 left-0 z-40">
        <Link to="/" className="cursor-pointer">
          <h2 className="text-2xl font-bold mb-6 hover:text-indigo-400 transition">
            Library
          </h2>
        </Link>
        <nav className="flex flex-col gap-4 mb-auto">
          <Link
            to="/browse" // Assuming /browse is your home or main doujinshi view
            className="hover:text-indigo-400 transition py-1"
          >
            🔍 Browse
          </Link>
          <Link
            to="/artists"
            className="bg-indigo-600 px-3 py-2 rounded transition" // Active style
          >
            🎨 Artists
          </Link>
          {/* ... other sidebar links ... */}
        </nav>
        <div className="flex flex-row justify-between items-center gap-2 pt-4 border-t border-gray-700">
          <SettingsButton />
          <SyncButton onSyncComplete={() => { /* Define or pass handler */ }} />
        </div>
      </aside>

      {/* Content Area */}
      <div className="lg:ml-64">
        {/* Mobile Header - Can be adapted if needed */}
        <nav className="lg:hidden sticky top-0 z-30 bg-gray-800 text-gray-200 p-3 shadow-md">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Artists</h1>
            <Link
              to="/"
              className="px-3 py-1 text-sm rounded hover:bg-indigo-600 transition"
            >
              🏠 Home
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Filter and Sort Bar */}
          <div className="bg-gray-800 p-4 rounded-lg mb-6 shadow">
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
                  Min Doujins
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

              {/* Min O-Count */}
              <div>
                <label
                  htmlFor="minOCount"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Min O-Count
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
                  Min Avg. Rating
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
                    <option value="doujinCount">Doujin Count</option>
                    <option value="totalOCount">O-Count</option>
                    <option value="averageRating">Rating</option>
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

          {/* Artist Grid */}
          {filteredAndSortedArtists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedArtists.map((artist) => (
                <ArtistCard key={artist.name} artist={artist} onToggleFavorite={handleToggleFavorite} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-10">
              <p className="text-xl">No artists found matching your criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ArtistsPage;
