import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";
import CoverImage from "../components/CoverImage";
import DoujinshiCard from "../components/DoujinshiCard";
import type { Doujinshi, ArtistPageResponse } from "../types";

type ViewMode = "cover" | "card";

const ArtistPage = () => {
  const { artist } = useParams<{ artist: string }>();
  const [artistData, setArtistData] =
    useState<ArtistPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cover");

  useEffect(() => {
    if (!artist) {
      setError("No username provided");
      setLoading(false);
      return;
    }

    const fetchArtistData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching artist data for: ${artist}`);
        const url = `/api/artist/0?username=${encodeURIComponent(artist)}`;
        console.log(`Request URL: ${url}`);

        const response = await fetch(url);
        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.log("Could not parse error response as JSON");
          }
          throw new Error(errorMessage);
        }

        const data: ArtistPageResponse = await response.json();
        console.log("Artist data received:", data);
        setArtistData(data);
      } catch (err) {
        console.error("Error fetching artist data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [artist]);

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
              <p className="text-gray-300">Loading artist data...</p>
              <p className="text-gray-500 text-sm mt-2">Username: {artist}</p>
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
                  Error Loading Artist
                </h2>
                <p className="text-gray-400 mb-2">Username: {artist}</p>
                <p className="text-red-400 mb-6">{error}</p>
                <Link
                  to="/"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!artistData) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Sidebar />
        <div className="lg:ml-64">
          <MobileNav />
          <main className="flex-1 p-6">
            <div className="flex flex-col items-center justify-center min-h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">
                  Artist Not Found
                </h2>
                <p className="text-gray-400 mb-6">
                  No data found for artist: {artist}
                </p>
                <Link
                  to="/"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { artistDetails, doujinshiList } = artistData;

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="lg:ml-64">
        <MobileNav />
        <main className="flex-1 p-6">
          {/* Artist Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition mb-6"
            >
              ← Back to Library
            </Link>

            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h1 className="text-4xl font-bold text-gray-100 mb-2">
                    🎨 {artistDetails.name}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-semibold">
                      {doujinshiList.length} work
                      {doujinshiList.length !== 1 ? "s" : ""}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      ID: {artistDetails.id}
                    </span>
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                      Total ♥: {artistDetails.totalOCount}
                    </span>
                    {artistDetails.averageRating && (
                      <span className="bg-yellow-600 text-white px-3 py-1 rounded-full">
                        Avg ★: {artistDetails.averageRating.toFixed(1)}
                      </span>
                    )}
                    {artistDetails.isFavorite && (
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full">
                        ❤️ Favorite
                      </span>
                    )}
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("cover")}
                    className={`px-3 py-2 rounded transition ${viewMode === "cover"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                  >
                    📚 Cover
                  </button>
                  <button
                    onClick={() => setViewMode("card")}
                    className={`px-3 py-2 rounded transition ${viewMode === "card"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                  >
                    📋 Card
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Works Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-6">
              Works by {artistDetails.name}
            </h2>

            {doujinshiList.length === 0 ? (
              <div className="bg-gray-800 rounded-2xl p-12 text-center">
                <p className="text-gray-400 text-lg">
                  No works found for this artist.
                </p>
              </div>
            ) : (
              <div
                className={`grid ${viewMode === "cover"
                  ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2"
                  : "grid-cols-1 md:grid-cols-2 gap-4"
                  }`}
              >
                {doujinshiList.map((d: Doujinshi) =>
                  viewMode === "cover" ? (
                    <Link
                      key={d.id}
                      to={`/doujinshi/${d.id}`}
                      className="block"
                    >
                      <CoverImage
                        imgUrl={d.thumbnail_url}
                        flag={getLanguageFlag(d.languages)}
                        title={d.title}
                        characters={d.characters || []}
                        tags={d.tags || []}
                        parodies={d.parodies || []}
                        rating={d.progress?.rating || undefined}
                        oCount={d.oCount}
                      />
                    </Link>
                  ) : (
                    <DoujinshiCard key={d.id} doujinshi={d} />
                  ),
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ArtistPage;
