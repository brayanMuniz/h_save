import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Doujinshi } from "../types";

import DoujinshiCard from "../components/DoujinshiCard";
import SimilarDoujinshi from "../components/SimilarDoujinshi";
import DoujinOverviewFilter from "../components/DoujinOverviewFilter";

const PREVIEW_LIMIT = 6;

const DoujinshiOverview: React.FC = () => {
  const { id } = useParams();
  const [doujinshi, setDoujinshi] = useState<Doujinshi | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [artistWorks, setArtistWorks] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/doujinshi/${id}`).then((res) => res.json()),
      fetch(`/api/doujinshi/${id}/pages`).then((res) => res.json()),
    ]).then(([data, pagesData]) => {
      setDoujinshi(data.doujinshiData);
      setPages(pagesData.pages || []);
      setLoading(false);

      if (data.doujinshiData) {
        const artist = (data.doujinshiData.Artists || [])[0];
        if (artist) {
          fetch(`/api/artist/${artist}`)
            .then((res) => res.json())
            .then((d) => setArtistWorks(d.doujinshi || []));
        }
      }
    });
  }, [id]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!doujinshi) return <div className="text-red-400">Not found</div>;

  return (
    <div className="flex gap-8 min-h-screen">

      {/* Top bar for navigation on md screens only */}
      <div className="fixed top-0 left-0 w-full h-16 bg-gray-900 flex items-center justify-between px-8 z-40 md:flex lg:hidden">
        {/* Back Button - Left Side */}
        <button
          onClick={() => window.history.back()}
          className="text-white text-xl hover:text-indigo-400 transition"
          aria-label="Go back to the previous page"
          title="Go back"
        >
          ←
        </button>

        {/* Home Link - Right Side */}
        <Link
          to="/"
          className="text-white text-xl font-bold hover:text-indigo-400 transition"
          aria-label="Go to Home page"
          title="Home"
        >
          Home
        </Link>
      </div>

      <DoujinOverviewFilter
        characters={doujinshi.Characters ?? []}
        parodies={doujinshi.Parodies ?? []}
        tags={doujinshi.Tags ?? []}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 ml-6 pt-20 lg:pt-0">
        <DoujinshiCard doujinshi={doujinshi} />

        {/* Limited Page Preview */}
        <section>
          <div className="grid grid-cols-2 gap-4 md:flex md:gap-2">
            {pages.slice(0, PREVIEW_LIMIT).map((url, idx) => {
              const match = url.match(/page\/(\d+\.(webp|jpg|jpeg|png|gif))$/i);
              const filename = match ? match[1] : "";
              return (
                <Link
                  key={idx}
                  to={`/doujinshi/${id}/page/${filename}`}
                  state={{ pages, currentIdx: idx }}
                  className="block"
                >
                  <img
                    src={url}
                    alt={`Page ${filename}`}
                    className="w-full h-48 md:w-30 object-cover rounded bg-gray-700 
                    hover:ring-2 hover:ring-indigo-400 transition"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Suggestions Row */}
        <h3 className="text-white">Similar Doujins</h3>
        <SimilarDoujinshi
          id={doujinshi.ID}
          characters={doujinshi.Characters ?? []}
          parodies={doujinshi.Parodies ?? []}
          tags={doujinshi.Tags ?? []}
        />
      </div>

      {/* Sidebar: Artist Other Works */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="bg-gray-800 rounded-lg p-4 text-gray-200 sticky top-8">
          <h4 className="text-lg font-bold mb-4">Artist Other Works</h4>
          <div className="grid grid-cols-2 gap-2">
            {artistWorks.map((d) => (
              <Link
                key={d.ID}
                to={`/doujinshi/${d.ID}`}
                className="block"
              >
                <img
                  src={d.thumbnail_url}
                  alt={d.Title}
                  className="w-full aspect-[3/4] object-cover rounded bg-gray-700 
                  hover:ring-2 hover:ring-indigo-400 transition"
                />
              </Link>
            ))}
            {artistWorks.length === 0 && (
              <span className="text-gray-400 col-span-2">No other works found.</span>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DoujinshiOverview;

