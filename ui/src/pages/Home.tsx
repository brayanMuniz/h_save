import { useEffect, useState } from "react";
import type { Doujinshi } from "../types";
import { Link } from "react-router-dom";

import HeaderBar from "../components/HeaderBar";
import CoverImage from "../components/CoverImage";
import DoujinshiCard from "../components/DoujinshiCard";
import SyncButton from "../components/SyncButton";
import SettingsButton from "../components/SettingsButton";

import { getLanguageFlag } from "../utils/utils";

const languages = [
  { code: "all", label: "All", flag: "🌐" },
  { code: "japanese", label: "Japanese", flag: "🇯🇵" },
  { code: "english", label: "English", flag: "🇺🇸" },
  { code: "chinese", label: "Chinese", flag: "🇨🇳" },
];

const Home = () => {
  const [doujinshi, setDoujinshi] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [viewMode, setViewMode] = useState<"card" | "cover">("cover");

  const fetchDoujinshi = async () => {
    try {
      const response = await fetch("/api/doujinshi");
      const data = await response.json();
      setDoujinshi(data.doujinshi || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch doujinshi:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoujinshi();
  }, []);

  const handleSyncComplete = () => {
    // Refresh the doujinshi data after successful sync
    fetchDoujinshi();
  };

  const filteredDoujinshi =
    selectedLanguage === "all"
      ? doujinshi
      : doujinshi.filter((d) =>
        d.languages?.some((lang) =>
          lang.toLowerCase().includes(selectedLanguage)
        )
      );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar: Visible on lg screens and up, fixed position */}
      <aside className="hidden lg:flex w-64 h-screen bg-gray-800 text-gray-200 flex-col p-6 
        rounded-r-2xl fixed top-0 left-0 z-40">
        <h2 className="text-2xl font-bold mb-6">Library</h2>
        <nav className="flex flex-col gap-4 mb-auto">
          <Link
            to="/browse"
            className="hover:text-indigo-400 transition py-1"
          >
            🔍 Browse
          </Link>

          <Link
            to="/artists"
            className="hover:text-indigo-400 transition py-1"
          >
            🎨 Artists
          </Link>
          <Link
            to="/groups"
            className="hover:text-indigo-400 transition py-1"
          >
            👥 Groups
          </Link>
          <button
            type="button"
            className="text-left hover:text-indigo-400 transition py-1"
          >
            🏷️ Tags
          </button>
          <button
            type="button"
            className="text-left hover:text-indigo-400 transition py-1"
          >
            🧑‍🎤 Characters
          </button>
          <button
            type="button"
            className="text-left hover:text-indigo-400 transition py-1"
          >
            🎭 Parodies
          </button>

          <div>
            <h3 className="text-lg font-semibold mb-2">Language</h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`px-3 py-1 rounded flex items-center gap-1
                  ${selectedLanguage === lang.code
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-700 hover:bg-indigo-600"
                    }`}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-row justify-between items-center gap-2 pt-4 border-t border-gray-700">
          <SettingsButton />
          <SyncButton onSyncComplete={handleSyncComplete} />
        </div>
      </aside>

      {/* Content Area: Takes margin for sidebar on lg screens */}
      <div className="lg:ml-64">
        {/* Sticky Top Navbar: Visible on screens smaller than lg */}
        <nav className="lg:hidden sticky top-0 z-30 bg-gray-800 text-gray-200 p-3 shadow-md">
          <div className="flex flex-wrap justify-center items-center gap-x-3 sm:gap-x-4 gap-y-2">
            <Link
              to="/browse"
              className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
            >
              🔍 Browse
            </Link>

            <Link
              to="/artists"
              className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
            >
              🎨 Artists
            </Link>
            <Link
              to="/groups"
              className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
            >
              👥 Groups
            </Link>
            <button
              type="button"
              className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
            >
              🏷️ Tags
            </button>
            <button
              type="button"
              className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
            >
              🧑‍🎤 Characters
            </button>
            <button
              type="button"
              className="px-2 py-1 text-sm rounded hover:bg-indigo-600 transition"
            >
              🎭 Parodies
            </button>

            {/* Mobile Sync Button */}
            <div className="ml-auto">
              <SyncButton onSyncComplete={handleSyncComplete} compact />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <HeaderBar viewMode={viewMode} setViewMode={setViewMode} />

          <div
            className={`grid ${viewMode === "cover"
              ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2"
              : "grid-cols-1 md:grid-cols-2 gap-4"
              }`}
          >
            {filteredDoujinshi.map((d) =>
              viewMode === "cover" ? (
                <Link
                  key={d.id}
                  to={`/doujinshi/${d.id}`}
                  className="block w-full sm:w-56"
                >
                  <CoverImage
                    imgUrl={d.thumbnail_url}
                    flag={getLanguageFlag(d.languages)}
                    title={d.title}
                    characters={d.characters ?? []}
                    tags={d.tags ?? []}
                    parodies={d.parodies ?? []}
                    oCount={d.oCount}
                    rating={d.progress.rating ?? 0}
                  />
                </Link>
              ) : (
                <DoujinshiCard key={d.id} doujinshi={d} />
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
