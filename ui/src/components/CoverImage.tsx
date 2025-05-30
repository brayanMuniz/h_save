import React, { useState } from "react";

type CoverImageProps = {
  imgUrl: string;
  flag: React.ReactNode;
  title: string;
  characters: string[];
  tags: string[];
  parodies: string[];
  rating?: number;
  oCount: number;
};

const MAX_ITEMS = 3; // Limit for characters/tags/parodies

const CoverImage: React.FC<CoverImageProps> = ({
  imgUrl,
  flag,
  title,
  characters,
  tags,
  parodies,
  rating,
  oCount,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleTouch = (e: React.TouchEvent) => {
    setHovered((prev) => !prev);
    e.stopPropagation();
  };

  return (
    <div
      className="relative w-56 h-80 rounded-2xl overflow-hidden shadow-lg bg-gray-900"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchEnd={handleTouch}
      tabIndex={0}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {/* Cover image */}
      <img
        src={imgUrl}
        alt={title}
        className={`absolute inset-0 w-full h-full object-cover transition duration-300 ${hovered ? "brightness-50" : ""
          }`}
        draggable={false}
      />

      {/* Flag in bottom right */}
      <div className="absolute bottom-3 right-3 z-10">
        <div className="bg-black/60 rounded px-3 py-1 text-xl">{flag}</div>
      </div>

      {/* Overlay on hover/focus */}
      {hovered && (
        <div className="absolute inset-0 flex flex-col justify-between p-4 z-20 text-white">
          <div>
            <div className="font-bold text-lg mb-2 truncate">{title}</div>
            <div className="text-sm mb-1">
              <span className="font-semibold">Characters:</span>{" "}
              {characters.slice(0, MAX_ITEMS).join(", ")}
            </div>
            <div className="text-sm mb-1">
              <span className="font-semibold">Tags:</span>{" "}
              {tags.slice(0, MAX_ITEMS).join(", ")}
            </div>
            <div className="text-sm mb-1">
              <span className="font-semibold">Parodies:</span>{" "}
              {parodies.slice(0, MAX_ITEMS).join(", ")}
            </div>
          </div>

          {/* Rating */}
          <div className="flex flex-col items-start mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) =>
                typeof rating === "number" && rating > 0 && i < rating ? (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ) : (
                  <span key={i} className="text-gray-500 text-lg">☆</span>
                )
              )}
            </div>

            {/* O Count and Flag row */}
            <div className="flex items-center justify-between w-full mt-2">
              <span className="text-xs bg-black/60 rounded px-2 py-1">
                O Count: {oCount}
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CoverImage;
