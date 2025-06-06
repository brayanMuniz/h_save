import React from "react";
import { Link } from "react-router-dom";

interface Entity {
  id: number;
  name: string;
  isFavorite: boolean;
  doujinCount: number;
  totalOCount: number;
  averageRating: number | null;
}

interface EntityCardProps {
  entity: Entity;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
  linkPrefix: string; // e.g., "/artist", "/character", "/tag"
}

const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  onToggleFavorite,
  linkPrefix,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-lg transition-transform hover:scale-105">
      <div>
        <div className="flex justify-between items-start mb-3">
          <Link
            to={`${linkPrefix}/${encodeURIComponent(entity.name)}`}
            className="text-lg font-bold text-indigo-400 hover:text-indigo-300 break-all"
          >
            {entity.name}
          </Link>
          <button
            onClick={() => onToggleFavorite(entity.id, entity.isFavorite)}
            className={`text-2xl transition-colors ${entity.isFavorite
              ? "text-red-500 hover:text-red-400"
              : "text-gray-500 hover:text-red-500"
              }`}
            title={entity.isFavorite ? "Unfavorite" : "Favorite"}
          >
            {entity.isFavorite ? "♥" : "♡"}
          </button>
        </div>
        <div className="text-sm text-gray-400 space-y-1">
          <p>
            <span className="font-semibold text-gray-300">Works:</span>{" "}
            {entity.doujinCount}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Total ♥:</span>{" "}
            {entity.totalOCount}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Avg. Rating:</span>{" "}
            {entity.averageRating ? entity.averageRating.toFixed(2) : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EntityCard;
