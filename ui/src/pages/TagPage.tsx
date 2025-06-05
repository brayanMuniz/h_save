import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import HeaderBar from "../components/HeaderBar";
import CoverImage from "../components/CoverImage";
import DoujinshiCard from "../components/DoujinshiCard";

import type {
  TagPageResponse,
  SortState,
} from "../types";

const TagPage = () => {
  const { tag } = useParams<{ tag: string }>();
  const [tagData, setTagData] = useState<TagPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for view and sorting
  const [viewMode, setViewMode] = useState<"card" | "cover">("cover");
  const [sort, setSort] = useState<SortState>({
    key: "uploaded",
    order: "desc",
  });

  useEffect(() => {
    if (!tag) {
      setError("No tag name provided");
      setLoading(false);
      return;
    }

    const fetchTagData = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `/api/tag/0?name=${encodeURIComponent(tag)}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP ${response.status}`);
        }

        const data: TagPageResponse = await response.json();
        setTagData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTagData();
  }, [tag]);

  const handleToggleFavorite = async () => {
    if (!tagData) return;

    const originalTagData = tagData;
    const { id, isFavorite } = tagData.tagDetails;

    // Optimistic UI update
    setTagData((prevData) => {
      if (!prevData) return null;
      return {
        ...prevData,
        tagDetails: {
          ...prevData.tagDetails,
          isFavorite: !isFavorite,
        },
      };
    });

    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch(`/api/user/favorite/tag/${id}`, {
        method: method,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
          `Failed to ${isFavorite ? "unfavorite" : "favorite"} tag`,
        );
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      setTagData(originalTagData); // Revert on error
      alert(
        `Error: ${err instanceof Error ? err.message : "Could not update favorite"
        }`,
      );
    }
  };

  const sortedDoujinshi = useMemo(() => {
    if (!tagData?.doujinshiList) return [];
    const sorted = [...tagData.doujinshiList];
    sorted.sort((a, b) => {
      const order = sort.order === "asc" ? 1 : -1;
      switch (sort.key) {
        case "title":
          return a.title.localeCompare(b.title) * order;
        case "uploaded":
          return (
            (new Date(a.uploaded).getTime() -
              new Date(b.uploaded).getTime()) *
            order
          );
        case "rating":
          return ((a.progress?.rating ?? 0) - (b.progress?.rating ?? 0)) * order;
        case "oCount":
          return (a.oCount - b.oCount) * order;
        default:
          return 0;
      }
    });
    return sorted;
  }, [tagData?.doujinshiList, sort]);

  const getLanguageFlag = (languages: string[]): React.ReactNode => {
    if (!languages || languages.length === 0) return <span>🌐</span>;
    const lang = languages[0].toLowerCase();
    const flags: Record<string, string> = {
      english: "🇺🇸",
      japanese: "🇯🇵",
      chinese: "🇨🇳",
    };
    return <span>{flags[lang] || "🌐"}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-300">Loading tag data...</p>
              <p className="text-gray-500 text-sm mt-2">Tag: {tag}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">
                  Error Loading Tag
                </h2>
                <p className="text-gray-400 mb-2">Tag: {tag}</p>
                <p className="text-red-400 mb-6">{error}</p>
                <Link
                  to="/tags"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                >
                  ← Back to All Tags
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!tagData) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">
                  Tag Not Found
                </h2>
                <p className="text-gray-400 mb-6">
                  No data found for tag: {tag}
                </p>
                <Link
                  to="/tags"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                >
                  ← Back to All Tags
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { tagDetails } = tagData;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Tag Header */}
          <div className="mb-4">
            <Link
              to="/tags"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition mb-6"
            >
              ← Back to All Tags
            </Link>
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h1 className="text-4xl font-bold text-gray-100 mb-2">
                    🏷️ {tagDetails.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-semibold">
                      {sortedDoujinshi.length} work
                      {sortedDoujinshi.length !== 1 ? "s" : ""}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      ID: {tagDetails.id}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      Total ♥: {tagDetails.totalOCount}
                    </span>
                    {tagDetails.averageRating && (
                      <span className="bg-yellow-600 text-white px-3 py-1 rounded-full">
                        Avg ★: {tagDetails.averageRating.toFixed(1)}
                      </span>
                    )}
                    <button
                      onClick={handleToggleFavorite}
                      className={`px-3 py-1 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${tagDetails.isFavorite
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white"
                        }`}
                      title={
                        tagDetails.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <span>
                        {tagDetails.isFavorite ? "❤️" : "♡"}
                      </span>
                      <span>
                        {tagDetails.isFavorite ? "Favorited" : "Favorite"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Header Bar */}
          <div className="sticky top-0 z-10 bg-gray-900 py-4 -mx-6 px-6 mb-4 shadow-md">
            <HeaderBar
              viewMode={viewMode}
              setViewMode={setViewMode}
              sort={sort}
              setSort={setSort}
              itemCount={sortedDoujinshi.length}
            />
          </div>

          {/* Works Section */}
          {sortedDoujinshi.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No works found with this tag.
            </div>
          ) : (
            <div
              className={`grid ${viewMode === "cover"
                ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
                : "grid-cols-1 md:grid-cols-2 gap-4"
                }`}
            >
              {sortedDoujinshi.map((d) =>
                viewMode === "cover" ? (
                  <Link key={d.id} to={`/doujinshi/${d.id}`} className="block">
                    <CoverImage
                      imgUrl={d.thumbnail_url}
                      flag={getLanguageFlag(d.languages)}
                      title={d.title}
                      characters={d.characters ?? []}
                      tags={d.tags ?? []}
                      parodies={d.parodies ?? []}
                      oCount={d.oCount}
                      rating={d.progress?.rating ?? 0}
                    />
                  </Link>
                ) : (
                  <DoujinshiCard key={d.id} doujinshi={d} />
                ),
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TagPage;
