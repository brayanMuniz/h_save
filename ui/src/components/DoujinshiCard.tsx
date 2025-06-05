import React, { useState } from "react";
import type { Doujinshi } from "../types";
import { Link } from "react-router-dom";

function getLanguageFlag(languages: string[]) {
  if (!languages || languages.length === 0) return "🏳️";
  if (languages.some((l) => l.toLowerCase().includes("jap"))) return "🇯🇵";
  if (languages.some((l) => l.toLowerCase().includes("eng"))) return "🇺🇸";
  if (languages.some((l) => l.toLowerCase().includes("chi"))) return "🇨🇳";
  return "🏳️";
}

const DoujinshiCard: React.FC<{ doujinshi: Doujinshi }> = ({ doujinshi }) => {
  const languageFlag = getLanguageFlag(doujinshi.languages);

  // Rating state
  const [currentRating, setCurrentRating] = useState<number>(
    doujinshi.progress?.rating ?? 0
  );
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isUpdatingRating, setIsUpdatingRating] = useState<boolean>(false);

  const updateRating = async (rating: number) => {
    if (isUpdatingRating) return;

    setIsUpdatingRating(true);
    const previousRating = currentRating;

    // Optimistic update
    setCurrentRating(rating);

    try {
      const response = await fetch(
        `/api/user/doujinshi/${doujinshi.id}/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: rating > 0 ? rating : null, // Send null for deletion
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update rating: ${response.status}`);
      }

      const data = await response.json();
      console.log("Rating updated successfully:", data);
    } catch (error) {
      console.error("Error updating rating:", error);
      // Revert optimistic update on error
      setCurrentRating(previousRating);
      // You might want to show a toast notification here
    } finally {
      setIsUpdatingRating(false);
    }
  };

  const handleStarClick = (starIndex: number) => {
    const newRating = starIndex + 1;
    // If clicking the same star that's already selected, unrate (set to 0)
    const finalRating = currentRating === newRating ? 0 : newRating;
    updateRating(finalRating);
  };

  const handleStarHover = (starIndex: number) => {
    if (!isUpdatingRating) {
      setHoverRating(starIndex + 1);
    }
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-900 rounded-xl shadow-lg p-4 mb-2 max-w-3xl">
      <div className="flex flex-col items-center mb-4 md:mb-0 md:mr-6">
        <Link to={`/doujinshi/${doujinshi.id}`}>
          <img
            src={doujinshi.thumbnail_url}
            alt={doujinshi.title}
            className="w-45 h-60 object-cover rounded-lg bg-gray-700 mb-4"
          />
        </Link>

        {/* Row: flag, categories, o count */}
        <div className="flex items-center gap-3 w-full justify-between px-2 mt-2">
          {/* Language flag */}
          <span className="text-2xl">{languageFlag}</span>
          {/* Categories */}
          <div className="flex space-x-1">
            {(doujinshi.categories ?? []).slice(0, 3).map((cat, idx) => (
              <Link
                key={idx}
                to={`/category/${encodeURIComponent(cat)}`}
                className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded hover:bg-gray-700 transition"
              >
                {cat}
              </Link>
            ))}
          </div>
          {/* O count */}
          <div className="flex items-center">
            <span
              className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-700 
              text-white font-bold text-lg shadow"
              title="O Count"
            >
              {doujinshi.oCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Metadata */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="text-left">
          <h3 className="text-lg font-bold text-white mb-2">
            {doujinshi.title}
          </h3>

          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Tags:</span>{" "}
            {(doujinshi.tags ?? []).map((tag, idx) => (
              <Link
                key={idx}
                to={`/tag/${encodeURIComponent(tag)}`}
                className="inline-block px-2 py-1 rounded mr-1 mb-1 text-xs transition
                  bg-indigo-700 hover:bg-indigo-500 text-white"
              >
                {tag}
              </Link>
            ))}
          </div>

          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Artists:</span>{" "}
            {(doujinshi.artists ?? []).map((artist, idx) => (
              <Link
                key={idx}
                to={`/artist/${encodeURIComponent(artist)}`}
                className="inline-block px-2 py-1 rounded mr-1 mb-1 text-xs transition
                  bg-pink-700 hover:bg-pink-500 text-white"
              >
                {artist}
              </Link>
            ))}
          </div>

          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Characters:</span>{" "}
            {(doujinshi.characters ?? []).map((character, idx) => (
              <Link
                key={idx}
                to={`/character/${encodeURIComponent(character)}`}
                className="inline-block px-2 py-1 rounded mr-1 mb-1 text-xs transition
                  bg-green-700 hover:bg-green-500 text-white"
              >
                {character}
              </Link>
            ))}
          </div>

          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Parodies:</span>{" "}
            {(doujinshi.parodies ?? []).map((parody, idx) => (
              <Link
                key={idx}
                to={`/parody/${encodeURIComponent(parody)}`}
                className="inline-block px-2 py-1 rounded mr-1 mb-1 text-xs transition
                  bg-yellow-700 hover:bg-yellow-500 text-white"
              >
                {parody}
              </Link>
            ))}
          </div>

          <div className="text-gray-300 text-sm mb-1">
            <span className="font-semibold">Groups:</span>{" "}
            {(doujinshi.groups ?? []).map((group, idx) => (
              <Link
                key={idx}
                to={`/group/${encodeURIComponent(group)}`}
                className="inline-block px-2 py-1 rounded mr-1 mb-1 text-xs transition
                  bg-blue-700 hover:bg-blue-500 text-white"
              >
                {group}
              </Link>
            ))}
          </div>

          <div className="flex flex-row justify-between">
            <div className="flex flex-col">
              <div className="text-gray-300 text-sm mb-1">
                <span className="font-semibold">Languages:</span>{" "}
                {(doujinshi.languages ?? []).map((language, idx) => (
                  <Link
                    key={idx}
                    to={`/language/${encodeURIComponent(language)}`}
                    className="inline-block px-2 py-1 rounded mr-1 mb-1 text-xs transition
                      bg-purple-700 hover:bg-purple-500 text-white"
                  >
                    {language}
                  </Link>
                ))}
              </div>

              <div className="text-gray-300 text-sm mb-1">
                <span className="font-semibold">Categories:</span>{" "}
                {(doujinshi.categories ?? []).map((category, idx) => (
                  <Link
                    key={idx}
                    to={`/category/${encodeURIComponent(category)}`}
                    className="inline-block px-2 py-1 rounded mr-1 mb-1 text-xs transition
                      bg-gray-700 hover:bg-gray-500 text-white"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>

            {/* Interactive Star Rating */}
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => {
                const starIndex = i;
                const displayRating =
                  hoverRating > 0 ? hoverRating : currentRating;
                const isFilled = starIndex < displayRating;
                const isHovering = hoverRating > 0;

                return (
                  <button
                    key={i}
                    onClick={() => handleStarClick(starIndex)}
                    onMouseEnter={() => handleStarHover(starIndex)}
                    onMouseLeave={handleStarLeave}
                    disabled={isUpdatingRating}
                    className={`text-lg transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded
                      ${isUpdatingRating
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                      }
                      ${isHovering ? "transform scale-105" : ""}`}
                    title={`Rate ${starIndex + 1} star${starIndex + 1 !== 1 ? "s" : ""
                      }${currentRating === starIndex + 1 ? " (click to remove)" : ""
                      }`}
                  >
                    <span
                      className={`${isFilled ? "text-yellow-400" : "text-gray-500"
                        } transition-colors duration-150`}
                    >
                      {isFilled ? "★" : "☆"}
                    </span>
                  </button>
                );
              })}
              {isUpdatingRating && (
                <span className="ml-2 text-xs text-gray-400">Updating...</span>
              )}
            </div>
          </div>

          <div className="flex flex-row mb-1 justify-between">
            <div className="text-gray-300 text-sm">
              <span className="font-semibold">Pages:</span> {doujinshi.pages}
            </div>

            <div className="text-right mr-4">
              <span className="text-gray-400 text-xs">
                {new Date(doujinshi.uploaded).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoujinshiCard;
