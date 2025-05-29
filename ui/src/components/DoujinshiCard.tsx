import React, { useState } from "react";
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

  // NOTE: this is for testing purposes. In the future this will just be used to manage filtering
  const handleAddFavorite = async (type: string, value: string) => {
    try {
      const res = await fetch(`/api/user/favorite/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: value }),
      });
      if (res.ok) {
        alert(`Added "${value}" to favorite ${type}s!`);
      } else {
        alert(`Failed to add "${value}" to favorite ${type}s.`);
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  // State for progress
  const [rating, setRating] = useState<number>(0);
  const [lastPage, setLastPage] = useState<number>(0);
  const [progress, setProgress] = useState<{ rating: number; lastPage: number } | null>(null);

  // Set progress
  const handleSetProgress = async () => {
    const res = await fetch(`/api/user/doujinshi/${doujinshi.ID}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, lastPage }),
    });
    if (res.ok) {
      alert("Progress saved!");
    } else {
      alert("Failed to save progress.");
    }
  };

  // Get progress
  const handleGetProgress = async () => {
    const res = await fetch(`/api/user/doujinshi/${doujinshi.ID}/progress`);
    if (res.ok) {
      const data = await res.json();
      setProgress({ rating: data.rating, lastPage: data.lastPage });
    } else {
      alert("No progress found.");
      setProgress(null);
    }
  };

  return (
    <div className="flex bg-gray-900 rounded-xl shadow-lg p-4 mb-2 max-w-3xl">
      <div className="flex flex-col items-center mr-6">
        <Link to={`/doujinshi/${doujinshi.ID.toString()}`}>
          <img
            src={doujinshi.thumbnail_url}
            alt={doujinshi.Title}
            className="w-45 h-60 object-cover rounded-lg bg-gray-700 mb-4"
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
            <span className="font-semibold">Tags:</span>{" "}
            {(doujinshi.Tags ?? []).map((tag, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFavorite("tag", tag)}
                className="inline-block bg-indigo-700 hover:bg-indigo-500 text-white text-xs px-2 py-1 rounded mr-1 mb-1 transition"
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Artists:</span>{" "}
            {(doujinshi.Artists ?? []).map((artist, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFavorite("artist", artist)}
                className="inline-block bg-pink-700 hover:bg-pink-500 text-white text-xs px-2 py-1 rounded mr-1 mb-1 transition"
                type="button"
              >
                {artist}
              </button>
            ))}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Characters:</span>{" "}
            {(doujinshi.Characters ?? []).map((character, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFavorite("character", character)}
                className="inline-block bg-green-700 hover:bg-green-500 text-white text-xs px-2 py-1 rounded mr-1 mb-1 transition"
                type="button"
              >
                {character}
              </button>
            ))}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Parodies:</span>{" "}
            {(doujinshi.Parodies ?? []).map((parody, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFavorite("parody", parody)}
                className="inline-block bg-yellow-700 hover:bg-yellow-500 text-white text-xs px-2 py-1 rounded mr-1 mb-1 transition"
                type="button"
              >
                {parody}
              </button>
            ))}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Groups:</span>{" "}
            {(doujinshi.Groups ?? []).map((group, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFavorite("group", group)}
                className="inline-block bg-blue-700 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded mr-1 mb-1 transition"
                type="button"
              >
                {group}
              </button>
            ))}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Languages:</span>{" "}
            {(doujinshi.Languages ?? []).map((language, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFavorite("language", language)}
                className="inline-block bg-purple-700 hover:bg-purple-500 text-white text-xs px-2 py-1 rounded mr-1 mb-1 transition"
                type="button"
              >
                {language}
              </button>
            ))}
          </div>
          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Categories:</span>{" "}
            {(doujinshi.Categories ?? []).map((category, idx) => (
              <button
                key={idx}
                onClick={() => handleAddFavorite("category", category)}
                className="inline-block bg-gray-700 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded mr-1 mb-1 transition"
                type="button"
              >
                {category}
              </button>
            ))}
          </div>


          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Pages:</span> {doujinshi.Pages}
          </div>

        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-gray-400 text-xs">
            {new Date(doujinshi.Uploaded).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Progress controls for testing */}
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <label className="text-gray-300 text-xs">Rating:</label>
          <input
            type="number"
            min={0}
            max={5}
            value={rating}
            onChange={e => setRating(Number(e.target.value))}
            className="w-12 px-1 py-0.5 rounded bg-gray-800 text-white text-xs"
          />
          <label className="text-gray-300 text-xs">Last Page:</label>
          <input
            type="number"
            min={0}
            value={lastPage}
            onChange={e => setLastPage(Number(e.target.value))}
            className="w-16 px-1 py-0.5 rounded bg-gray-800 text-white text-xs"
          />
          <button
            onClick={handleSetProgress}
            className="bg-green-700 hover:bg-green-600 text-white text-xs px-2 py-1 rounded"
          >
            Save Progress
          </button>
          <button
            onClick={handleGetProgress}
            className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
          >
            Load Progress
          </button>
        </div>
        {progress && (
          <div className="text-xs text-gray-400 mt-1">
            Saved: Rating {progress.rating}, Last Page {progress.lastPage}
          </div>
        )}
      </div>


    </div>
  );
};

export default DoujinshiCard;
