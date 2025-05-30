import { useEffect, useState } from "react";
import type { Doujinshi } from "../types";
import { Link } from "react-router-dom";

import HeaderBar from "../components/HeaderBar";
import CoverImage from "../components/CoverImage";
import DoujinshiCard from "../components/DoujinshiCard";

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

  useEffect(() => {
    fetch("/api/doujinshi")
      .then((res) => res.json())
      .then((data) => {
        setDoujinshi(data.doujinshi || []);
        setLoading(false);
      });
  }, []);

  const filteredDoujinshi =
    selectedLanguage === "all"
      ? doujinshi
      : doujinshi.filter((d) =>
        d.Languages?.some((lang) =>
          lang.toLowerCase().includes(selectedLanguage)
        )
      );

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900"> {/* Base container */}
      {/* Sidebar: Visible on lg screens and up, fixed position */}
      <aside className="hidden lg:flex w-64 h-screen bg-gray-800 text-gray-200 flex-col p-6 rounded-r-2xl fixed top-0 left-0 z-40">
        <h2 className="text-2xl font-bold mb-6">Library</h2>
        <nav className="flex flex-col gap-4 mb-auto"> {/* mb-auto pushes language filter down */}
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
        </nav>

        {/* Language Filter - remains at the bottom of the sidebar */}
        <div> {/* Removed mt-auto from here, mb-auto on nav pushes this group down */}
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
      </aside>

      {/* Content Area: Takes margin for sidebar on lg screens */}
      <div className="lg:ml-64">
        {/* Sticky Top Navbar: Visible on screens smaller than lg */}
        <nav className="lg:hidden sticky top-0 z-30 bg-gray-800 text-gray-200 p-3 shadow-md">
          <div className="flex flex-wrap justify-center items-center gap-x-3 sm:gap-x-4 gap-y-2">
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
                  key={d.ID}
                  to={`/doujinshi/${d.ID}`}
                  className="block w-full sm:w-56"
                >
                  <CoverImage
                    imgUrl={d.thumbnail_url}
                    flag={getLanguageFlag(d.Languages)}
                    title={d.Title}
                    characters={d.Characters ?? []}
                    tags={d.Tags ?? []}
                    parodies={d.Parodies ?? []}
                    oCount={0}
                  // rating={d.rating}
                  />
                </Link>
              ) : (
                <DoujinshiCard key={d.ID} doujinshi={d} />
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
