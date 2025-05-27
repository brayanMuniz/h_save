import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DoujinshiCard from "./DoujinshiCard";
import type { Doujinshi } from "../types";

// Helper: limit preview pages
const PREVIEW_LIMIT = 6;
const SUGGESTIONS_LIMIT = 8;
const ARTIST_WORKS_LIMIT = 6;

const DoujinshiOverview: React.FC = () => {
  const { galleryId } = useParams();
  const [doujinshi, setDoujinshi] = useState<Doujinshi | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Doujinshi[]>([]);
  const [artistWorks, setArtistWorks] = useState<Doujinshi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!galleryId) return;
    setLoading(true);

    // Fetch main doujinshi and its pages
    Promise.all([
      fetch(`/api/doujinshi/${galleryId}`).then((res) => res.json()),
      fetch(`/api/doujinshi/${galleryId}/pages`).then((res) => res.json()),
    ]).then(([data, pagesData]) => {
      setDoujinshi(data.doujinshiData);
      setPages(pagesData.pages || []);
      setLoading(false);

      // Fetch suggestions and artist works after main doujinshi is loaded
      if (data.doujinshiData) {
        // Suggestions: based on tags/characters
        fetch(
          `/api/doujinshi/similar?tags=${encodeURIComponent(
            (data.doujinshiData.Tags || []).join(",")
          )}&characters=${encodeURIComponent(
            (data.doujinshiData.Characters || []).join(",")
          )}&exclude=${galleryId}&limit=${SUGGESTIONS_LIMIT}`
        )
          .then((res) => res.json())
          .then((d) => setSuggestions(d.doujinshi || []));

        // Artist other works
        const artist = (data.doujinshiData.Artists || [])[0];
        if (artist) {
          fetch(
            `/api/doujinshi/by-artist?artist=${encodeURIComponent(
              artist
            )}&exclude=${galleryId}&limit=${ARTIST_WORKS_LIMIT}`
          )
            .then((res) => res.json())
            .then((d) => setArtistWorks(d.doujinshi || []));
        }
      }
    });
  }, [galleryId]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!doujinshi) return <div className="text-red-400">Not found</div>;

  return (
    <div className="flex gap-8 min-h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-8">
        {/* Doujinshi Card */}
        <DoujinshiCard doujinshi={doujinshi} />

        {/* Limited Page Preview */}
        <section>
          <h4 className="text-gray-200 text-lg mb-2">Preview</h4>
          <div className="flex gap-2">
            {pages.slice(0, PREVIEW_LIMIT).map((url, idx) => {
              const match = url.match(/page\/(\d+\.(webp|jpg|jpeg|png|gif))$/i);
              const filename = match ? match[1] : "";
              return (
                <Link
                  key={idx}
                  to={`/doujinshi/${galleryId}/page/${filename}`}
                  state={{ pages, currentIdx: idx }}
                  className="block"
                >
                  <img
                    src={url}
                    alt={`Page ${filename}`}
                    className="w-20 h-28 object-cover rounded bg-gray-700 hover:ring-2 hover:ring-indigo-400 transition"
                  />
                </Link>
              );
            })}
            {pages.length > PREVIEW_LIMIT && (
              <span className="text-gray-400 flex items-center ml-2">
                +{pages.length - PREVIEW_LIMIT} more
              </span>
            )}
          </div>
        </section>

        {/* Suggestions Row */}
        <section>
          <h4 className="text-gray-200 text-lg mb-2">
            Suggestions based on character and tags
          </h4>
          <div className="flex gap-2 overflow-x-auto">
            {suggestions.map((d) => (
              <Link
                key={d.GalleryID}
                to={`/doujinshi/${d.GalleryID}`}
                className="block"
              >
                <img
                  src={d.thumbnail_url}
                  alt={d.Title}
                  className="w-20 h-28 object-cover rounded bg-gray-700 hover:ring-2 hover:ring-indigo-400 transition"
                />
                <div className="text-xs text-gray-300 truncate w-20">{d.Title}</div>
              </Link>
            ))}
            {suggestions.length === 0 && (
              <span className="text-gray-400">No suggestions found.</span>
            )}
          </div>
        </section>
      </div>

      {/* Sidebar: Artist Other Works */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="bg-gray-800 rounded-lg p-4 text-gray-200 sticky top-8">
          <h4 className="text-lg font-bold mb-4">Artist Other Works</h4>
          <div className="grid grid-cols-2 gap-2">
            {artistWorks.map((d) => (
              <Link
                key={d.GalleryID}
                to={`/doujinshi/${d.GalleryID}`}
                className="block"
              >
                <img
                  src={d.thumbnail_url}
                  alt={d.Title}
                  className="w-full aspect-[3/4] object-cover rounded bg-gray-700 hover:ring-2 hover:ring-indigo-400 transition"
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
