import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DoujinshiCard from "./DoujinshiCard";
import type { Doujinshi } from "../types";

const DoujinshiOverview: React.FC = () => {
  const { galleryId } = useParams();
  const [doujinshi, setDoujinshi] = useState<Doujinshi | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!galleryId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/doujinshi/${galleryId}`).then((res) => res.json()),
      fetch(`/api/doujinshi/${galleryId}/pages`).then((res) => res.json()),
    ]).then(([data, pagesData]) => {
      setDoujinshi(data.doujinshiData);
      setPages(pagesData.pages || []);
      setLoading(false);
    });
  }, [galleryId]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!doujinshi) return <div className="text-red-400">Not found</div>;

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-48 flex-shrink-0 hidden md:block">
        <div className="bg-gray-800 rounded-lg p-4 text-gray-200">
          Data for later
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <DoujinshiCard doujinshi={doujinshi} />

        <div className="mt-8">
          <h4 className="text-gray-200 text-lg mb-4">Pages</h4>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {pages.map((url, idx) => {
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
                    className="w-full aspect-[3/4] object-cover rounded bg-gray-700 
                    hover:ring-2 hover:ring-indigo-400 transition"
                  />
                </Link>
              );

            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoujinshiOverview;
