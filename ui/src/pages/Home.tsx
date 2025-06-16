import { useEffect, useState, useMemo } from "react";
import type { Doujinshi } from "../types";
import { Link } from "react-router-dom";

import HeaderBar from "../components/HeaderBar";
import CoverImage from "../components/CoverImage";
import DoujinshiCard from "../components/DoujinshiCard";
import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";

import { getLanguageFlag } from "../utils/utils";

const Home = () => {
  const [doujinshi, setDoujinshi] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);
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

  const shuffledDoujinshi = useMemo(() => {
    return [...doujinshi].sort(() => Math.random() - 0.5);
  }, [doujinshi]);

  const itemsToDisplay = shuffledDoujinshi;

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
      <Sidebar />

      {/* Content Area: Takes margin for sidebar on lg screens */}
      <div className="lg:ml-64">
        <MobileNav />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <HeaderBar viewMode={viewMode} setViewMode={setViewMode} />

          {itemsToDisplay.length === 0 && !loading ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-lg">
                No entries found in your library.
              </p>
              <p className="text-gray-500 mt-2">
                Try syncing or adding new items.
              </p>
            </div>
          ) : (
            <div
              className={`grid ${viewMode === "cover"
                ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
                : "grid-cols-1 md:grid-cols-2 gap-4"
                }`}
            >
              {itemsToDisplay.map((d) =>
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
                      characters={d.characters ?? []}
                      tags={d.tags ?? []}
                      parodies={d.parodies ?? []}
                      oCount={d.oCount}
                      rating={d.progress?.rating ?? 0} // Ensure progress exists
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

export default Home;
