import React from "react";
import { Link } from "react-router-dom";
import type { Group } from "../types";

interface GroupCardProps {
  group: Group;
  onToggleFavorite: (groupId: number, isFavorite: boolean) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onToggleFavorite }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-lg transition-transform hover:scale-105">
      <div>
        <div className="flex justify-between items-start mb-3">
          <Link
            to={`/group/${encodeURIComponent(group.name)}`}
            className="text-lg font-bold text-indigo-400 hover:text-indigo-300 break-all"
          >
            {group.name}
          </Link>
          <button
            onClick={() => onToggleFavorite(group.id, group.isFavorite)}
            className={`text-2xl transition-colors ${group.isFavorite
                ? "text-red-500 hover:text-red-400"
                : "text-gray-500 hover:text-red-500"
              }`}
            title={group.isFavorite ? "Unfavorite" : "Favorite"}
          >
            {group.isFavorite ? "♥" : "♡"}
          </button>
        </div>
        <div className="text-sm text-gray-400 space-y-1">
          <p>
            <span className="font-semibold text-gray-300">Works:</span>{" "}
            {group.doujinCount}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Total ♥:</span>{" "}
            {group.totalOCount}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Avg. Rating:</span>{" "}
            {group.averageRating ? group.averageRating.toFixed(2) : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
