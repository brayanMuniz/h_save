import React, { useState } from "react";
import type { BrowseFilters, SavedFilter } from "../types";

interface Props {
  savedFilters: SavedFilter[];
  onLoadFilter: (filters: BrowseFilters) => void;
  onDeleteFilter: (id: number) => void;
  onClearAll: () => void;
}

const MobileFilterBar: React.FC<Props> = ({
  savedFilters,
  onLoadFilter,
  onDeleteFilter,
  onClearAll,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative bg-gray-800 p-2 border-b border-gray-700 lg:hidden">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none flex justify-between items-center"
      >
        <span>💾 Load Saved Filter...</span>
        <span
          className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""
            }`}
        >
          ▼
        </span>
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 mx-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
          {savedFilters.length > 0 ? (
            savedFilters.map((saved) => (
              <div
                key={saved.id}
                className="p-2 flex justify-between items-center hover:bg-gray-600 border-b border-gray-600/50 last:border-b-0"
              >
                <button
                  onClick={() => {
                    onLoadFilter(saved.filters);
                    setIsDropdownOpen(false);
                  }}
                  className="text-left flex-1 px-2 py-1"
                >
                  {saved.name}
                </button>
                <button
                  onClick={() => onDeleteFilter(saved.id)}
                  className="text-red-400 hover:text-red-300 text-xl p-1"
                  title="Delete filter"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-400 text-sm">No saved filters.</div>
          )}
          <div className="p-2 border-t border-gray-600/50">
            <button
              onClick={() => {
                onClearAll();
                setIsDropdownOpen(false);
              }}
              className="w-full text-center text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-600"
            >
              Clear Current Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFilterBar;
