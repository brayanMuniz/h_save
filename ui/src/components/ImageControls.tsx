import React, { useState, useEffect } from 'react';
import type { Image } from '../types';

// Reuse the icons from your DoujinReader
const MinusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

interface ImageControlsProps {
  image: Image;
  onUpdate?: () => void;
}

const ImageControls: React.FC<ImageControlsProps> = ({ image, onUpdate }) => {
  const [oCount, setOCount] = useState(image.o_count);
  const [rating, setRating] = useState(image.rating);
  const [isFavorited, setIsFavorited] = useState(false);

  // Update local state when image changes
  useEffect(() => {
    setOCount(image.o_count);
    setRating(image.rating);
    // TODO: Check if image is favorited once we have the API
  }, [image]);

  const updateOCount = async (newCount: number) => {
    setOCount(newCount);
    onUpdate?.();
    // TODO: API call to update oCount
    console.log('Update oCount for image', image.id, 'to', newCount);
  };

  const updateRating = async (newRating: number) => {
    setRating(newRating);
    onUpdate?.();
    // TODO: API call to update rating
    console.log('Update rating for image', image.id, 'to', newRating);
  };

  const toggleFavorite = async () => {
    setIsFavorited(!isFavorited);
    onUpdate?.();
    // TODO: API call to toggle favorite
    console.log('Toggle favorite for image', image.id);
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/80 px-6 py-3 rounded-lg">
      {/* O Counter */}
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">O:</span>
        <div className="flex items-center gap-2 bg-gray-800/80 rounded-lg p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateOCount(Math.max(0, oCount - 1));
            }}
            className="px-2 py-2 bg-gray-700/80 text-white rounded hover:bg-gray-600/80 transition"
          >
            <MinusIcon />
          </button>
          <span className="text-white w-8 text-center">{oCount}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateOCount(oCount + 1);
            }}
            className="px-2 py-2 bg-gray-700/80 text-white rounded hover:bg-gray-600/80 transition"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Rating Stars */}
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">Rating:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={(e) => {
                e.stopPropagation();
                updateRating(star === rating ? 0 : star);
              }}
              className="text-2xl hover:scale-110 transition-transform"
            >
              <span className={star <= rating ? 'text-yellow-400' : 'text-gray-600'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite();
        }}
        className={`p-2 rounded-full transition ${isFavorited
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-gray-700/80 text-gray-300 hover:bg-red-600 hover:text-white'
          }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill={isFavorited ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    </div>
  );
};

export default ImageControls;
