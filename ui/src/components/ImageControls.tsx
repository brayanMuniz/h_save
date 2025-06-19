import React, { useState, useEffect } from 'react';
import type { Image } from '../types';

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
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Update local state when image changes
  useEffect(() => {
    setOCount(image.o_count);
    setRating(image.rating);
  }, [image.id, image.o_count, image.rating]);

  // Ensure rating state stays in sync with prop changes
  useEffect(() => {
    if (rating !== image.rating) {
      setRating(image.rating);
    }
  }, [image.rating]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/user/images/${image.id}/favorite`);
        const data = await response.json();
        setIsFavorited(data.is_favorited);
      } catch (error) {
        console.error('Failed to check favorite status:', error);
      }
    };
    checkFavoriteStatus();
  }, [image.id]);

  const updateOCount = async (newCount: number) => {
    setOCount(newCount);
    try {
      await fetch(`/api/user/images/${image.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ o_count: newCount })
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update O count:', error);
    }
  };

  const updateRating = async (newRating: number) => {
    // Update local state immediately for responsive UI
    setRating(newRating);
    try {
      await fetch(`/api/user/images/${image.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating })
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update rating:', error);
      // Revert on error
      setRating(image.rating);
    }
  };

  const toggleFavorite = async () => {
    try {
      const response = await fetch(`/api/user/images/${image.id}/favorite`, {
        method: 'POST'
      });
      const data = await response.json();
      setIsFavorited(data.is_favorited);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleInteraction = (callback: () => void) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    callback();
    onUpdate?.(); // Reset the UI timer
  };

  // Handle star rating - if clicking on current rating, remove it (set to 0)
  const handleStarClick = (starValue: number) => {
    const newRating = starValue === rating ? 0 : starValue;
    updateRating(newRating);
  };

  return (
    <div
      className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/80 rounded-lg touch-manipulation ${isTouchDevice ? 'px-4 py-4 gap-6' : 'px-6 py-3'
        }`}
      style={{ zIndex: 65 }}
      onMouseEnter={() => onUpdate?.()} // Keep UI visible when hovering over controls
      onTouchStart={() => onUpdate?.()} // Keep UI visible when touching controls
    >
      {/* O Counter */}
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">O:</span>
        <div className={`flex items-center gap-2 bg-gray-800/80 rounded-lg ${isTouchDevice ? 'p-2' : 'p-1'}`}>
          <button
            onClick={handleInteraction(() => updateOCount(Math.max(0, oCount - 1)))}
            className={`bg-gray-700/80 text-white rounded hover:bg-gray-600/80 transition touch-manipulation ${isTouchDevice ? 'px-3 py-3' : 'px-2 py-2'
              }`}
          >
            <MinusIcon />
          </button>
          <span className={`text-white text-center ${isTouchDevice ? 'w-10 text-lg' : 'w-8'}`}>
            {oCount}
          </span>
          <button
            onClick={handleInteraction(() => updateOCount(oCount + 1))}
            className={`bg-gray-700/80 text-white rounded hover:bg-gray-600/80 transition touch-manipulation ${isTouchDevice ? 'px-3 py-3' : 'px-2 py-2'
              }`}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Rating Stars */}
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">Rating:</span>
        <div className={`flex ${isTouchDevice ? 'gap-2' : 'gap-1'}`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={handleInteraction(() => handleStarClick(star))}
              className={`hover:scale-110 transition-transform touch-manipulation ${isTouchDevice ? 'text-3xl p-1' : 'text-2xl'
                }`}
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
        onClick={handleInteraction(toggleFavorite)}
        className={`rounded-full transition touch-manipulation ${isTouchDevice ? 'p-3' : 'p-2'
          } ${isFavorited
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-gray-700/80 text-gray-300 hover:bg-red-600 hover:text-white'
          }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={isTouchDevice ? 'h-7 w-7' : 'h-6 w-6'}
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
