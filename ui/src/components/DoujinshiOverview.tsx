import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Doujinshi } from "../types";

import DoujinshiCard from "./DoujinshiCard";
import SimilarDoujinshi from "./SimilarDoujinshi";

// Helper: limit preview pages
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

    // Fetch main doujinshi and its pages
    Promise.all([
      fetch(`/api/doujinshi/${id}`).then((res) => res.json()),
      fetch(`/api/doujinshi/${id}/pages`).then((res) => res.json()),
    ]).then(([data, pagesData]) => {
      setDoujinshi(data.doujinshiData);
      setPages(pagesData.pages || []);
      setLoading(false);

      if (data.doujinshiData) {

        // Artist other works
        const artist = (data.doujinshiData.Artists || [])[0];
        if (artist) {
          fetch(
            `/api/artist/${artist}`
          )
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

      <Link
        to="/"
        className="fixed bottom-8 left-8 bg-gray-700 hover:bg-gray-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-150 ease-in-out z-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
        aria-label="Back to Home"
        title="Back to Home"
      >
        <span className="text-2xl font-semibold">←</span>
      </Link>

      {/* Main Content: */}
      <div className="flex-1 flex flex-col gap-6 ml-6">

        <DoujinshiCard doujinshi={doujinshi} />

        {/* Limited Page Preview */}
        <section>
          <div className="flex gap-2">
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
                    className="w-30 h-48 object-cover rounded bg-gray-700 
                    hover:ring-2 hover:ring-indigo-400 transition"
                  />
                </Link>
              );
            })}

          </div>
        </section>

        {/* Suggestions Row */}
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
