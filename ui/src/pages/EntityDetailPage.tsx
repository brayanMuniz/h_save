import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";

import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import HeaderBar from "../components/HeaderBar";
import CoverImage from "../components/CoverImage";
import DoujinshiCard from "../components/DoujinshiCard";

import type {
  Doujinshi,
  EntityPageResponse,
  SortState,
} from "../types";

interface EntityDetailPageProps {
  entityTypeSingular: string;
  entityTypePlural: string;
  paramName: string;
  apiEndpointPrefix: string;
  favoriteApiEndpointPrefix: string;
  detailsResponseKey: string;
  backLink: string;
  icon: string;
}

const EntityDetailPage: React.FC<EntityDetailPageProps> = ({
  entityTypeSingular,
  entityTypePlural,
  paramName,
  apiEndpointPrefix,
  favoriteApiEndpointPrefix,
  detailsResponseKey,
  backLink,
  icon,
}) => {
  const params = useParams<{ [key: string]: string }>();
  const entityName = params[paramName];

  const [data, setData] = useState<EntityPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"card" | "cover">("cover");
  const [sort, setSort] = useState<SortState>({
    key: "uploaded",
    order: "desc",
  });

  useEffect(() => {
    if (!entityName) {
      setError(`No ${entityTypeSingular.toLowerCase()} name provided`);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `${apiEndpointPrefix}/0?name=${encodeURIComponent(
          entityName,
        )}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP ${response.status}`);
        }

        const responseData = await response.json();
        const normalizedData: EntityPageResponse = {
          details: responseData[detailsResponseKey],
          doujinshiList: responseData.doujinshiList,
        };
        setData(normalizedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unknown error occurred",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [entityName, apiEndpointPrefix, detailsResponseKey, entityTypeSingular]);

  const handleToggleFavorite = async () => {
    if (!data) return;
    const originalData = data;
    const { id, isFavorite } = data.details;

    setData((prev) =>
      prev ? { ...prev, details: { ...prev.details, isFavorite: !isFavorite } } : null,
    );

    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch(`${favoriteApiEndpointPrefix}/${id}`, {
        method,
      });
      if (!response.ok) throw new Error("Failed to update favorite status");
    } catch (err) {
      setData(originalData);
      alert(`Error: Could not update favorite status.`);
    }
  };

  const sortedDoujinshi = useMemo(() => {
    if (!data?.doujinshiList) return [];
    const sorted = [...data.doujinshiList];
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
  }, [data?.doujinshiList, sort]);

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
              <p className="text-gray-300">
                Loading {entityTypeSingular.toLowerCase()} data...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {entityTypeSingular}: {entityName}
              </p>
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
                  Error Loading {entityTypeSingular}
                </h2>
                <p className="text-gray-400 mb-2">
                  {entityTypeSingular}: {entityName}
                </p>
                <p className="text-red-400 mb-6">{error}</p>
                <Link
                  to={backLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                >
                  ← Back to All {entityTypePlural}
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">
                  {entityTypeSingular} Not Found
                </h2>
                <p className="text-gray-400 mb-6">
                  No data found for {entityTypeSingular.toLowerCase()}:{" "}
                  {entityName}
                </p>
                <Link
                  to={backLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                >
                  ← Back to All {entityTypePlural}
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { details } = data;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="lg:ml-64 flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-4">
            <Link
              to={backLink}
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition mb-6"
            >
              ← Back to All {entityTypePlural}
            </Link>
            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h1 className="text-4xl font-bold text-gray-100 mb-2">
                    {icon} {details.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-semibold">
                      {sortedDoujinshi.length} work
                      {sortedDoujinshi.length !== 1 ? "s" : ""}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      ID: {details.id}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      Total ♥: {details.totalOCount}
                    </span>
                    {details.averageRating && (
                      <span className="bg-yellow-600 text-white px-3 py-1 rounded-full">
                        Avg ★: {details.averageRating.toFixed(1)}
                      </span>
                    )}
                    <button
                      onClick={handleToggleFavorite}
                      className={`px-3 py-1 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${details.isFavorite
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white"
                        }`}
                      title={
                        details.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <span>{details.isFavorite ? "❤️" : "♡"}</span>
                      <span>
                        {details.isFavorite ? "Favorited" : "Favorite"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="sticky top-0 z-10 bg-gray-900 py-4 -mx-6 px-6 mb-4 shadow-md">
            <HeaderBar
              viewMode={viewMode}
              setViewMode={setViewMode}
              sort={sort}
              setSort={setSort}
              itemCount={sortedDoujinshi.length}
            />
          </div>
          {sortedDoujinshi.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No works found for this {entityTypeSingular.toLowerCase()}.
            </div>
          ) : (
            <div
              className={`grid ${viewMode === "cover"
                  ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
                  : "grid-cols-1 md:grid-cols-2 gap-4"
                }`}
            >
              {sortedDoujinshi.map((d: Doujinshi) =>
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

export default EntityDetailPage;
