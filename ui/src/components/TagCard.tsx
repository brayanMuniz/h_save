import React from "react";
import { Link } from "react-router-dom";
import type { Tag } from "../types"; // You'll need to define this type

interface TagCardProps {
  tag: Tag;
  onToggleFavorite: (tagId: number, isFavorite: boolean) => void;
}

const TagCard: React.FC<TagCardProps> = ({ tag, onToggleFavorite }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-lg transition-transform hover:scale-105">
      <div>
        <div className="flex justify-between items-start mb-3">
          <Link
            to={`/tag/${encodeURIComponent(tag.name)}`}
            className="text-lg font-bold text-indigo-400 hover:text-indigo-300 break-all"
          >
            {tag.name}
          </Link>
          <button
            onClick={() => onToggleFavorite(tag.id, tag.isFavorite)}
            className={`text-2xl transition-colors ${tag.isFavorite
              ? "text-red-500 hover:text-red-400"
              : "text-gray-500 hover:text-red-500"
              }`}
            title={tag.isFavorite ? "Unfavorite" : "Favorite"}
          >
            {tag.isFavorite ? "♥" : "♡"}
          </button>
        </div>
        <div className="text-sm text-gray-400 space-y-1">
          <p>
            <span className="font-semibold text-gray-300">Works:</span>{" "}
            {tag.doujinCount}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Total ♥:</span>{" "}
            {tag.totalOCount}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Avg. Rating:</span>{" "}
            {tag.averageRating ? tag.averageRating.toFixed(2) : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TagCard;
