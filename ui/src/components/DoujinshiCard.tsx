import React from "react";
import type { Doujinshi } from "../types";
import { Link } from 'react-router-dom';

function getLanguageFlag(languages: string[]) {
  if (!languages || languages.length === 0) return "🏳️";
  if (languages.some((l) => l.toLowerCase().includes("jap"))) return "🇯🇵";
  if (languages.some((l) => l.toLowerCase().includes("eng"))) return "🇺🇸";
  if (languages.some((l) => l.toLowerCase().includes("chi"))) return "🇨🇳";
  return "🏳️";
}

const DoujinshiCard: React.FC<{ doujinshi: Doujinshi }> = ({ doujinshi }) => {
  const languageFlag = getLanguageFlag(doujinshi.Languages);

  return (
    <div className="flex bg-gray-900 rounded-xl shadow-lg p-4 mb-6 w-full max-w-3xl mx-auto">
      <div className="flex flex-col items-center mr-6">


        <Link to={`/doujinshi/${doujinshi.GalleryID}`}>
          <img
            src={doujinshi.thumbnail_url} // src={null}
            alt={doujinshi.Title}
            className="w-40 h-56 object-cover rounded-lg bg-gray-700 mb-4"
          />
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-2xl">{languageFlag}</span>
          <div className="flex space-x-1">
            {(doujinshi.Categories ?? []).slice(0, 3).map((cat, idx) => (
              <span
                key={idx}
                className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Metadata */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="text-left">
          <h3 className="text-lg font-bold text-white mb-2">{doujinshi.Title}</h3>

          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Parodies:</span> {(doujinshi.Parodies ?? []).join(", ")}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Tags:</span> {(doujinshi.Tags ?? []).join(", ")}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Artists:</span> {(doujinshi.Artists ?? []).join(", ")}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Characters:</span> {(doujinshi.Characters ?? []).join(", ")}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Groups:</span> {(doujinshi.Groups ?? []).join(", ")}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div></div>
          <span className="text-gray-400 text-xs">
            {new Date(doujinshi.Uploaded).toLocaleDateString()}
          </span>
        </div>

      </div>
    </div>
  );
};

export default DoujinshiCard;
