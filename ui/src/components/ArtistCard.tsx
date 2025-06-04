import React from "react";
import type { Artist } from "../types";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";

interface ArtistCardProps {
  artist: Artist;
  onToggleFavorite: (artistId: number, currentIsFavorite: boolean) => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  onToggleFavorite,
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(artist.id, artist.isFavorite);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-shadow duration-300 ease-in-out p-5 text-gray-200 relative">
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 text-2xl p-1 rounded-full hover:bg-gray-700 transition-colors"
        aria-label={artist.isFavorite ? "Unfavorite artist" : "Favorite artist"}
      >
        {artist.isFavorite ? (
          <FaHeart className="text-red-500" />
        ) : (
          <FaRegHeart className="text-gray-400 hover:text-red-400" />
        )}
      </button>

      <Link
        to={`/artist/${encodeURIComponent(artist.name)}`} // Link to a page showing doujins by this artist
        className="block" // Make the link cover the card content area
      >
        <h3 className="text-xl font-bold text-indigo-400 truncate pr-10">
          {/* pr-10 to avoid overlap with heart */}
          {artist.name}
        </h3>
        <div className="space-y-2 text-sm mt-3">
          <p>
            <span className="font-semibold text-gray-400">Doujins:</span>{" "}
            {artist.doujinCount}
          </p>
          <p>
            <span className="font-semibold text-gray-400">Total O-Count:</span>{" "}
            {artist.totalOCount.toLocaleString()}
          </p>
          <p>
            <span className="font-semibold text-gray-400">Avg. Rating:</span>{" "}
            {artist.averageRating !== null
              ? `${artist.averageRating.toFixed(1)} / 5`
              : "N/A"}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ArtistCard;
